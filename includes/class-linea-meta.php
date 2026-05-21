<?php
defined( 'ABSPATH' ) || exit;

/**
 * Aggiunge alla tassonomia colmac_linea:
 *  - Campo immagine tile (con media picker WP)
 *  - QR Code generato lato client con link diretto alla selezione lingua
 *  - Espone image_url nella REST API del termine
 */
class Colmac_Linea_Meta {

    public static function init() {
        add_action( 'init',                          [ __CLASS__, 'register_meta' ] );
        add_action( 'colmac_linea_edit_form_fields', [ __CLASS__, 'render_fields' ], 10, 2 );
        add_action( 'edited_colmac_linea',           [ __CLASS__, 'save_fields'  ], 10, 2 );
        add_action( 'admin_enqueue_scripts',         [ __CLASS__, 'enqueue_assets' ] );
    }

    // -------------------------------------------------------------------------
    // Registra il meta — show_in_rest lo espone in /wp-json/wp/v2/colmac_linea
    // -------------------------------------------------------------------------
    public static function register_meta() {
        register_meta( 'term', 'colmac_linea_image', [
            'object_subtype'    => 'colmac_linea',
            'show_in_rest'      => true,
            'single'            => true,
            'type'              => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'auth_callback'     => function() { return current_user_can( 'manage_options' ); },
        ] );
    }

    // -------------------------------------------------------------------------
    // Render campi nella pagina di modifica del termine
    // -------------------------------------------------------------------------
    public static function render_fields( WP_Term $term ) {
        $image_url = get_term_meta( $term->term_id, 'colmac_linea_image', true );
        $app_url   = self::get_app_base_url() . '/#/linea/' . $term->slug;
        wp_nonce_field( 'colmac_linea_meta_save', 'colmac_linea_meta_nonce' );
        ?>
        <tr class="form-field">
            <th scope="row">
                <label for="colmac_linea_image">Immagine tile</label>
            </th>
            <td>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                    <input
                        type="text"
                        id="colmac_linea_image"
                        name="colmac_linea_image"
                        value="<?php echo esc_attr( $image_url ); ?>"
                        class="regular-text"
                        placeholder="URL immagine…"
                        style="flex:1;"
                    />
                    <button type="button" class="button colmac-media-btn">
                        📎 Scegli immagine
                    </button>
                </div>
                <?php if ( $image_url ) : ?>
                    <img src="<?php echo esc_url( $image_url ); ?>"
                         style="margin-top:8px;max-height:80px;border-radius:4px;border:1px solid #ddd;" />
                <?php endif; ?>
                <p class="description">Immagine mostrata nella tile della linea sul portale clienti.</p>
            </td>
        </tr>

        <tr class="form-field">
            <th scope="row">QR Code</th>
            <td>
                <div
                    id="colmac-qr-container"
                    data-url="<?php echo esc_attr( $app_url ); ?>"
                    style="display:inline-block;padding:10px;background:#fff;border:1px solid #ddd;border-radius:4px;"
                ></div>
                <p class="description" style="margin-top:8px;">
                    URL: <code><?php echo esc_html( $app_url ); ?></code>
                </p>
                <button type="button" id="colmac-qr-download" class="button" style="margin-top:6px;">
                    ⬇ Scarica QR
                </button>
            </td>
        </tr>
        <?php
    }

    // -------------------------------------------------------------------------
    // Salva i campi
    // -------------------------------------------------------------------------
    public static function save_fields( int $term_id ) {
        if ( ! isset( $_POST['colmac_linea_meta_nonce'] ) ) return;
        if ( ! wp_verify_nonce( $_POST['colmac_linea_meta_nonce'], 'colmac_linea_meta_save' ) ) return;
        if ( ! current_user_can( 'manage_options' ) ) return;

        if ( isset( $_POST['colmac_linea_image'] ) ) {
            update_term_meta( $term_id, 'colmac_linea_image', esc_url_raw( $_POST['colmac_linea_image'] ) );
        }
    }

    // -------------------------------------------------------------------------
    // Enqueue assets solo sulla pagina di modifica del termine colmac_linea
    // -------------------------------------------------------------------------
    public static function enqueue_assets( string $hook ) {
        if ( $hook !== 'term.php' ) return;
        if ( ! isset( $_GET['taxonomy'] ) || $_GET['taxonomy'] !== 'colmac_linea' ) return;

        wp_enqueue_media();

        wp_enqueue_script(
            'qrcodejs',
            'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
            [],
            null,
            true
        );

        wp_add_inline_script( 'qrcodejs', self::get_inline_js() );
    }

    // -------------------------------------------------------------------------
    // JS inline — QR + media picker
    // -------------------------------------------------------------------------
    private static function get_inline_js(): string {
        return <<<'JS'
        (function($) {
            // ---- QR Code ----
            var container = document.getElementById('colmac-qr-container');
            if (container && typeof QRCode !== 'undefined') {
                var qr = new QRCode(container, {
                    text:           container.getAttribute('data-url'),
                    width:          180,
                    height:         180,
                    colorDark:      '#1a1a1a',
                    colorLight:     '#ffffff',
                    correctLevel:   QRCode.CorrectLevel.H
                });

                document.getElementById('colmac-qr-download').addEventListener('click', function() {
                    var canvas = container.querySelector('canvas');
                    if (!canvas) return;
                    var link    = document.createElement('a');
                    var slug    = container.getAttribute('data-url').split('/').pop();
                    link.download = 'qr-' + slug + '.png';
                    link.href     = canvas.toDataURL('image/png');
                    link.click();
                });
            }

            // ---- Media picker ----
            $(document).on('click', '.colmac-media-btn', function() {
                var $input = $('#colmac_linea_image');
                var frame  = wp.media({
                    title:    'Seleziona immagine tile',
                    button:   { text: 'Usa questa immagine' },
                    multiple: false
                });
                frame.on('select', function() {
                    var att = frame.state().get('selection').first().toJSON();
                    $input.val(att.url);
                });
                frame.open();
            });
        })(jQuery);
        JS;
    }
    // -------------------------------------------------------------------------
    // Helper — trova dinamicamente la pagina con lo shortcode [colmac_manuali]
    // -------------------------------------------------------------------------
    private static function get_app_base_url(): string {
        global $wpdb;
        $page_id = $wpdb->get_var(
            "SELECT ID FROM {$wpdb->posts}
             WHERE post_status = 'publish'
               AND post_type   = 'page'
               AND post_content LIKE '%colmac_manuali%'
             LIMIT 1"
        );
        if ( $page_id ) {
            return rtrim( get_permalink( (int) $page_id ), '/' );
        }
        return rtrim( home_url(), '/' );
    }

}
