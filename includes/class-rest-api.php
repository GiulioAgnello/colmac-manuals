<?php
defined( 'ABSPATH' ) || exit;

/**
 * REST API — endpoint di ricerca manuali.
 *
 * GET /wp-json/colmac/v1/manuali
 *
 * Parametri (tutti opzionali, combinabili):
 *   q            — ricerca libera su model_id o nome_modello
 *   linea        — slug tassonomia colmac_linea       (es. "betomix")
 *   tipo_macchina— slug tassonomia colmac_tipo_macchina (es. "betoniera")
 *   tipo_doc     — filtra documenti per tipo           (es. "catalogo")
 *   lang         — filtra documenti per lingua         (es. "it")
 *
 * Risposta (array JSON):
 * [
 *   {
 *     "id": 42,
 *     "model_id": "BETOMIX-350RS",
 *     "nome": "BetoMix 350 RS",
 *     "linea": "BETOMix",
 *     "tipo_macchina": "Betoniera",
 *     "documenti": [
 *       { "tipo": "catalogo", "lingua": "it", "url": "https://...", "filename": "..." }
 *     ]
 *   }
 * ]
 */
class Colmac_REST_API {

    const NAMESPACE = 'colmac/v1';
    const ROUTE     = '/manuali';

    public static function init() {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    public static function register_routes() {
        register_rest_route( self::NAMESPACE, self::ROUTE, [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_manuali' ],
            'permission_callback' => '__return_true',  // endpoint pubblico
            'args'                => self::get_args(),
        ] );
    }

    // -------------------------------------------------------------------------
    // Argomenti con sanitizzazione
    // -------------------------------------------------------------------------
    private static function get_args() {
        return [
            'q' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ],
            'linea' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ],
            'tipo_macchina' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ],
            'tipo_doc' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ],
            'lang' => [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Handler principale
    // -------------------------------------------------------------------------
    public static function get_manuali( WP_REST_Request $request ) {
        $q             = $request->get_param( 'q' );
        $linea         = $request->get_param( 'linea' );
        $tipo_macchina = $request->get_param( 'tipo_macchina' );
        $tipo_doc      = $request->get_param( 'tipo_doc' );
        $lang          = $request->get_param( 'lang' );

        // --- costruzione WP_Query ---
        $args = [
            'post_type'      => 'colmac_manuale',
            'post_status'    => 'publish',
            'posts_per_page' => 50,
            'orderby'        => 'title',
            'order'          => 'ASC',
        ];

        // Ricerca testuale: cerca su titolo, model_id e nome_modello
        if ( ! empty( $q ) ) {
            $args['s'] = $q;
            // Estendi la search anche ai meta
            add_filter( 'posts_search', [ __CLASS__, 'extend_search_to_meta' ], 10, 2 );
        }

        // Filtri tassonomia
        $tax_query = [];
        if ( ! empty( $linea ) ) {
            $tax_query[] = [
                'taxonomy' => 'colmac_linea',
                'field'    => 'slug',
                'terms'    => $linea,
            ];
        }
        if ( ! empty( $tipo_macchina ) ) {
            $tax_query[] = [
                'taxonomy' => 'colmac_tipo_macchina',
                'field'    => 'slug',
                'terms'    => $tipo_macchina,
            ];
        }
        if ( count( $tax_query ) > 1 ) {
            $tax_query['relation'] = 'AND';
        }
        if ( ! empty( $tax_query ) ) {
            $args['tax_query'] = $tax_query;
        }

        $query = new WP_Query( $args );

        // Rimuovi il filtro dopo la query
        remove_filter( 'posts_search', [ __CLASS__, 'extend_search_to_meta' ] );

        $results = [];
        foreach ( $query->posts as $post ) {
            $item = self::format_post( $post, $tipo_doc, $lang );
            // Se filtri su tipo_doc o lang, escludi manuale se nessun doc passa il filtro
            if ( ( ! empty( $tipo_doc ) || ! empty( $lang ) ) && empty( $item['documenti'] ) ) {
                continue;
            }
            $results[] = $item;
        }

        return rest_ensure_response( $results );
    }

    // -------------------------------------------------------------------------
    // Formatta un singolo post in array JSON
    // -------------------------------------------------------------------------
    private static function format_post( WP_Post $post, string $tipo_doc, string $lang ): array {
        $model_id    = get_post_meta( $post->ID, '_colmac_model_id', true );
        $nome        = get_post_meta( $post->ID, '_colmac_nome_modello', true );
        $raw_docs    = get_post_meta( $post->ID, '_colmac_documenti', true );
        if ( ! is_array( $raw_docs ) ) $raw_docs = [];

        // Termini tassonomie
        $linea_terms     = get_the_terms( $post->ID, 'colmac_linea' );
        $macchina_terms  = get_the_terms( $post->ID, 'colmac_tipo_macchina' );

        // Documenti: filtra se richiesto
        $documenti = [];
        foreach ( $raw_docs as $doc ) {
            $doc_tipo  = $doc['tipo']   ?? '';
            $doc_lingua = $doc['lingua'] ?? '';
            $pdf_url   = $doc['pdf_url'] ?? '';

            if ( ! empty( $tipo_doc ) && $doc_tipo !== $tipo_doc ) continue;
            if ( ! empty( $lang )     && $doc_lingua !== $lang )   continue;

            $documenti[] = [
                'tipo'     => $doc_tipo,
                'lingua'   => $doc_lingua,
                'url'      => $pdf_url,
                'filename' => $doc['pdf_name'] ?? basename( $pdf_url ),
            ];
        }

        return [
            'id'           => $post->ID,
            'model_id'     => $model_id ?: $post->post_name,
            'nome'         => $nome ?: $post->post_title,
            'slug'         => $post->post_name,
            'linea'        => $linea_terms && ! is_wp_error( $linea_terms )
                                ? $linea_terms[0]->name : '',
            'tipo_macchina'=> $macchina_terms && ! is_wp_error( $macchina_terms )
                                ? $macchina_terms[0]->name : '',
            'documenti'    => $documenti,
        ];
    }

    // -------------------------------------------------------------------------
    // Estende la ricerca WP anche ai meta model_id e nome_modello
    // -------------------------------------------------------------------------
    public static function extend_search_to_meta( string $search, WP_Query $query ): string {
        global $wpdb;
        if ( empty( $search ) || ! $query->is_search() ) {
            return $search;
        }
        $term = $query->get( 's' );
        $like = '%' . $wpdb->esc_like( $term ) . '%';

        $search .= $wpdb->prepare(
            " OR EXISTS (
                SELECT 1 FROM {$wpdb->postmeta} pm
                WHERE pm.post_id = {$wpdb->posts}.ID
                  AND pm.meta_key IN ('_colmac_model_id','_colmac_nome_modello')
                  AND pm.meta_value LIKE %s
            )",
            $like
        );

        return $search;
    }
}
