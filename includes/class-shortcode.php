<?php
defined( 'ABSPATH' ) || exit;

/**
 * Shortcode [colmac_manuali]
 *
 * Inserisci in qualsiasi pagina WP per montare la React app.
 * Lo script viene caricato SOLO sulle pagine che contengono lo shortcode.
 *
 * Uso: [colmac_manuali]
 *
 * Opzioni future (non implementate in v1):
 *   [colmac_manuali linea="betomix"]  — pre-filtra per linea
 */
class Colmac_Shortcode {

    private static bool $enqueue_needed = false;

    public static function init() {
        add_shortcode( 'colmac_manuali', [ __CLASS__, 'render' ] );
        add_action( 'wp_footer',         [ __CLASS__, 'maybe_enqueue' ] );
    }

    // -------------------------------------------------------------------------
    // Render shortcode — restituisce il div mount point
    // -------------------------------------------------------------------------
    public static function render( array $atts ): string {
        self::$enqueue_needed = true;

        $atts = shortcode_atts( [
            'linea' => '',
        ], $atts, 'colmac_manuali' );

        // Passa eventuali filtri pre-impostati come data attribute
        $data_linea = esc_attr( $atts['linea'] );

        return sprintf(
            '<div id="colmac-manuali-app" data-linea="%s"></div>',
            $data_linea
        );
    }

    // -------------------------------------------------------------------------
    // Enqueue script React + dati inline solo se shortcode è presente
    // -------------------------------------------------------------------------
    public static function maybe_enqueue() {
        if ( ! self::$enqueue_needed ) {
            return;
        }

        $asset_file = COLMAC_MANUALS_DIR . 'dist/app.js';
        $version    = file_exists( $asset_file )
            ? filemtime( $asset_file )
            : COLMAC_MANUALS_VERSION;

        wp_enqueue_script(
            'colmac-manuali-app',
            COLMAC_MANUALS_URL . 'dist/app.js',
            [],
            $version,
            true   // in footer
        );

        // Dati passati all'app React tramite window.colmacData
        wp_localize_script( 'colmac-manuali-app', 'colmacData', [
            'apiUrl'  => esc_url( rest_url( 'colmac/v1/manuali' ) ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
            'siteUrl' => esc_url( get_site_url() ),
        ] );
    }
}
