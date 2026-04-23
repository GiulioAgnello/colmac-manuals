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

add_action( 'plugins_loaded', function () {
    Colmac_CPT::init();
    Colmac_Metabox::init();
    Colmac_REST_API::init();
    Colmac_Shortcode::init();
} );
