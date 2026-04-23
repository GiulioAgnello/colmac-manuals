<?php
defined( 'ABSPATH' ) || exit;

class Colmac_CPT {

    public static function init() {
        add_action( 'init', [ __CLASS__, 'register_post_type' ] );
        add_action( 'init', [ __CLASS__, 'register_taxonomies' ] );
    }

    // -------------------------------------------------------------------------
    // CPT: colmac_manuale
    // -------------------------------------------------------------------------
    public static function register_post_type() {
        register_post_type( 'colmac_manuale', [
            'labels' => [
                'name'               => 'Manuali',
                'singular_name'      => 'Manuale',
                'add_new'            => 'Aggiungi manuale',
                'add_new_item'       => 'Aggiungi nuovo manuale',
                'edit_item'          => 'Modifica manuale',
                'new_item'           => 'Nuovo manuale',
                'view_item'          => 'Visualizza manuale',
                'search_items'       => 'Cerca manuali',
                'not_found'          => 'Nessun manuale trovato',
                'not_found_in_trash' => 'Nessun manuale nel cestino',
            ],
            'public'        => true,
            'show_in_rest'  => true,   // abilita REST e Gutenberg
            'menu_icon'     => 'dashicons-media-document',
            'menu_position' => 5,
            'supports'      => [ 'title', 'thumbnail' ],
            'has_archive'   => false,
            'rewrite'       => [ 'slug' => 'm', 'with_front' => false ],
            // slug = /m/{post_name} — il post_name DEVE essere il model_id
        ] );
    }

    // -------------------------------------------------------------------------
    // Tassonomie: linea, tipo_macchina
    // -------------------------------------------------------------------------
    public static function register_taxonomies() {

        // Linea prodotto (BETOMix, CompactMix, ProMix, UltraMix …)
        register_taxonomy( 'colmac_linea', 'colmac_manuale', [
            'labels' => [
                'name'          => 'Linea',
                'singular_name' => 'Linea',
                'all_items'     => 'Tutte le linee',
                'edit_item'     => 'Modifica linea',
                'add_new_item'  => 'Aggiungi linea',
            ],
            'hierarchical'      => true,   // comportamento categoria
            'show_in_rest'      => true,
            'show_admin_column' => true,
            'rewrite'           => [ 'slug' => 'linea' ],
        ] );

        // Tipo macchina (Betoniera, Mescolatore Planetario …)
        register_taxonomy( 'colmac_tipo_macchina', 'colmac_manuale', [
            'labels' => [
                'name'          => 'Tipo macchina',
                'singular_name' => 'Tipo macchina',
                'all_items'     => 'Tutti i tipi',
                'edit_item'     => 'Modifica tipo',
                'add_new_item'  => 'Aggiungi tipo',
            ],
            'hierarchical'      => true,
            'show_in_rest'      => true,
            'show_admin_column' => true,
            'rewrite'           => [ 'slug' => 'tipo-macchina' ],
        ] );
    }
}
