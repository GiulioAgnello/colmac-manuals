<?php
/**
 * Template Name: Colmac App
 *
 * Pagina full-screen per la React app Colmac.
 * Selezionalo dalla sidebar della pagina in WP → Template → Colmac App.
 */
defined( 'ABSPATH' ) || exit;

// Forza l'enqueue della React app
do_shortcode( '[colmac_manuali]' );
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php wp_title( '|', true, 'right' ); ?><?php bloginfo( 'name' ); ?></title>
    <?php wp_head(); ?>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #f8f8f8; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        #colmac-root {
            min-height: 100vh;
            max-width: 900px;
            margin: 0 auto;
            padding: 0 24px 64px;
        }
    </style>
</head>
<body>
    <div id="colmac-manuali-app"></div>
    <?php wp_footer(); ?>
</body>
</html>
