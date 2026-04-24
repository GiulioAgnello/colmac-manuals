<?php
/**
 * Plugin Name:  Colmac Manuals
 * Plugin URI:   https://docs.colmac-medioitalia.com
 * Description:  Portale documentazione Colmac — CPT manuali, REST API, shortcode React.
 * Version:      1.0.0
 * Author:       Giulio Agnello
 * Text Domain:  colmac-manuals
 */

defined( 'ABSPATH' ) || exit;

define( 'COLMAC_MANUALS_VERSION', '1.0.0' );
define( 'COLMAC_MANUALS_DIR',     plugin_dir_path( __FILE__ ) );
define( 'COLMAC_MANUALS_URL',     plugin_dir_url( __FILE__ ) );

require_once COLMAC_MANUALS_DIR . 'includes/class-cpt.php';
require_once COLMAC_MANUALS_DIR . 'includes/class-metabox.php';
require_once COLMAC_MANUALS_DIR . 'includes/class-rest-api.php';
require_once COLMAC_MANUALS_DIR . 'includes/class-shortcode.php';
require_once COLMAC_MANUALS_DIR . 'includes/class-importer.php';

add_action( 'plugins_loaded', function () {
    Colmac_CPT::init();
    Colmac_Metabox::init();
    Colmac_REST_API::init();
    Colmac_Shortcode::init();
    Colmac_Importer::init();
} );

// Usa il template custom su qualsiasi pagina che contiene lo shortcode [colmac_manuali]
add_filter( 'template_include', function( $template ) {
    if ( ! is_page() ) return $template;

    $post = get_post();
    if ( $post && has_shortcode( $post->post_content, 'colmac_manuali' ) ) {
        $plugin_template = COLMAC_MANUALS_DIR . 'templates/colmac-app.php';
        if ( file_exists( $plugin_template ) ) {
            return $plugin_template;
        }
    }
    return $template;
} );
