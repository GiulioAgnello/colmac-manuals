<?php
defined( 'ABSPATH' ) || exit;

/**
 * Meta box custom — nessuna dipendenza da plugin esterni.
 * Usa il media uploader nativo di WordPress per i PDF.
 *
 * Struttura dati salvata:
 *   _colmac_model_id      → string
 *   _colmac_nome_modello  → string
 *   _colmac_documenti     → array serializzato di:
 *       [ ['tipo' => '', 'lingua' => '', 'pdf_id' => 0, 'pdf_url' => '', 'pdf_name' => ''] ]
 */
class Colmac_Metabox {

    public static function init() {
        add_action( 'add_meta_boxes',  [ __CLASS__, 'register' ] );
        add_action( 'save_post',       [ __CLASS__, 'save' ], 10, 2 );
        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ] );
    }

    // -------------------------------------------------------------------------
    // Registra le meta box
    // -------------------------------------------------------------------------
    public static function register() {
        add_meta_box(
            'colmac_dati_modello',
            'Dati modello',
            [ __CLASS__, 'render_dati' ],
            'colmac_manuale',
            'normal',
            'high'
        );
        add_meta_box(
            'colmac_documenti',
            'Documenti PDF',
            [ __CLASS__, 'render_documenti' ],
            'colmac_manuale',
            'normal',
            'high'
        );
    }

    // -------------------------------------------------------------------------
    // Enqueue: media uploader + JS repeater
    // -------------------------------------------------------------------------
    public static function enqueue_assets( $hook ) {
        if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ] ) ) return;

        $screen = get_current_screen();
        if ( ! $screen || $screen->post_type !== 'colmac_manuale' ) return;

        // Media uploader WP
        wp_enqueue_media();


        // JS inline per repeater + media picker
        wp_add_inline_script( 'jquery', self::get_inline_js() );

        // CSS inline
        wp_add_inline_style( 'wp-admin', self::get_inline_css() );
    }

    // -------------------------------------------------------------------------
    // Render: dati modello
    // -------------------------------------------------------------------------
    public static function render_dati( WP_Post $post ) {
        wp_nonce_field( 'colmac_save_meta', 'colmac_nonce' );

        $model_id  = get_post_meta( $post->ID, '_colmac_model_id', true );
        $nome      = get_post_meta( $post->ID, '_colmac_nome_modello', true );
        $photo_id  = (int) get_post_meta( $post->ID, '_colmac_model_photo_id', true );
        $photo_url = $photo_id ? wp_get_attachment_image_url( $photo_id, 'medium' ) : '';
        ?>
        <div class="colmac-fields-row">
            <div class="colmac-field">
                <label for="colmac_model_id"><strong>ID Modello</strong> <span class="required">*</span></label>
                <input
                    type="text"
                    id="colmac_model_id"
                    name="colmac_model_id"
                    value="<?php echo esc_attr( $model_id ); ?>"
                    placeholder="es. BETOMIX-350RS"
                    class="widefat"
                    required
                />
                <p class="description">Codice univoco del modello. Usato nell'URL <code>/m/{model_id}</code> e nella ricerca.</p>
            </div>
            <div class="colmac-field">
                <label for="colmac_nome_modello"><strong>Nome modello</strong> <span class="required">*</span></label>
                <input
                    type="text"
                    id="colmac_nome_modello"
                    name="colmac_nome_modello"
                    value="<?php echo esc_attr( $nome ); ?>"
                    placeholder="es. BetoMix 350 RS"
                    class="widefat"
                    required
                />
                <p class="description">Nome leggibile mostrato ai clienti.</p>
            </div>
        </div>

        <div class="colmac-field colmac-field--photo">
            <label><strong>Foto del modello</strong></label>
            <div class="colmac-photo-wrap">
                <div class="colmac-photo-preview" id="colmac-photo-preview">
                    <?php if ( $photo_url ) : ?>
                        <img src="<?php echo esc_url( $photo_url ); ?>" alt="Foto modello" />
                    <?php else : ?>
                        <span class="colmac-photo-empty">Nessuna foto selezionata</span>
                    <?php endif; ?>
                </div>
                <input type="hidden" id="colmac_model_photo_id" name="colmac_model_photo_id" value="<?php echo esc_attr( $photo_id ?: '' ); ?>" />
                <div class="colmac-photo-actions">
                    <button type="button" class="button" id="colmac-btn-pick-photo">🖼 Scegli foto</button>
                    <button type="button" class="button" id="colmac-btn-remove-photo"<?php echo $photo_url ? '' : ' style="display:none"'; ?>>✕ Rimuovi foto</button>
                </div>
                <p class="description">Immagine mostrata nella card del modello sul portale. Consigliato: JPG/PNG, 800×600 px.</p>
            </div>
        </div>
        <?php
    }

    // -------------------------------------------------------------------------
    // Render: repeater documenti
    // -------------------------------------------------------------------------
    public static function render_documenti( WP_Post $post ) {
        $documenti = get_post_meta( $post->ID, '_colmac_documenti', true );
        if ( ! is_array( $documenti ) ) $documenti = [];
        ?>
        <div id="colmac-docs-wrapper">
            <div id="colmac-docs-list">
                <?php if ( empty( $documenti ) ) : ?>
                    <?php echo self::render_doc_row( 0, [] ); ?>
                <?php else : ?>
                    <?php foreach ( $documenti as $i => $doc ) : ?>
                        <?php echo self::render_doc_row( $i, $doc ); ?>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>

            <button type="button" id="colmac-add-doc" class="button">
                + Aggiungi documento
            </button>
        </div>

        <?php // Template nascosto per JS ?>
        <script type="text/html" id="colmac-doc-template">
            <?php echo self::render_doc_row( '__INDEX__', [] ); ?>
        </script>
        <?php
    }

    // -------------------------------------------------------------------------
    // Helper: singola riga documento
    // -------------------------------------------------------------------------
    private static function render_doc_row( $index, array $doc ): string {
        $tipo    = $doc['tipo']     ?? '';
        $lingua  = $doc['lingua']   ?? '';
        $pdf_id  = $doc['pdf_id']   ?? 0;
        $pdf_url = $doc['pdf_url']  ?? '';
        $pdf_name = $doc['pdf_name'] ?? '';

        $tipi = [
            ''        => '— Tipo documento —',
            'manuale' => 'Manuale d\'uso e manutenzione',
            'esploso' => 'Esploso',
        ];
        $lingue = [
            ''   => '— Lingua —',
            'it' => '🇮🇹 Italiano',
            'en' => '🇬🇧 English',
            'fr' => '🇫🇷 Français',
            'de' => '🇩🇪 Deutsch',
            'es' => '🇪🇸 Español',
            'pt' => '🇵🇹 Português',
        ];

        $tipo_options = '';
        foreach ( $tipi as $val => $label ) {
            $selected = selected( $tipo, $val, false );
            $tipo_options .= "<option value=\"{$val}\" {$selected}>{$label}</option>";
        }
        $lingua_options = '';
        foreach ( $lingue as $val => $label ) {
            $selected = selected( $lingua, $val, false );
            $lingua_options .= "<option value=\"{$val}\" {$selected}>{$label}</option>";
        }

        $pdf_preview = $pdf_url
            ? "<span class=\"colmac-pdf-name\">{$pdf_name}</span><a href=\"{$pdf_url}\" target=\"_blank\" class=\"colmac-pdf-view\">Apri</a>"
            : '<span class="colmac-pdf-name colmac-pdf-empty">Nessun file selezionato</span>';

        return "
        <div class=\"colmac-doc-row\" data-index=\"{$index}\">
            <div class=\"colmac-doc-handle\" title=\"Trascina per riordinare\">☰</div>
            <div class=\"colmac-doc-fields\">
                <select name=\"colmac_documenti[{$index}][tipo]\" class=\"colmac-select\">{$tipo_options}</select>
                <select name=\"colmac_documenti[{$index}][lingua]\" class=\"colmac-select\">{$lingua_options}</select>
                <div class=\"colmac-pdf-picker\">
                    <input type=\"hidden\" name=\"colmac_documenti[{$index}][pdf_id]\"   class=\"colmac-pdf-id\"   value=\"{$pdf_id}\" />
                    <input type=\"hidden\" name=\"colmac_documenti[{$index}][pdf_url]\"  class=\"colmac-pdf-url\"  value=\"{$pdf_url}\" />
                    <input type=\"hidden\" name=\"colmac_documenti[{$index}][pdf_name]\" class=\"colmac-pdf-name-field\" value=\"{$pdf_name}\" />
                    <button type=\"button\" class=\"button colmac-btn-pick-pdf\">📎 Scegli PDF</button>
                    <div class=\"colmac-pdf-preview\">{$pdf_preview}</div>
                </div>
            </div>
            <button type=\"button\" class=\"colmac-btn-remove\" title=\"Rimuovi\">&times;</button>
        </div>";
    }

    // -------------------------------------------------------------------------
    // Save
    // -------------------------------------------------------------------------
    public static function save( int $post_id, WP_Post $post ) {
        // Verifiche sicurezza
        if ( ! isset( $_POST['colmac_nonce'] ) ) return;
        if ( ! wp_verify_nonce( $_POST['colmac_nonce'], 'colmac_save_meta' ) ) return;
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
        if ( $post->post_type !== 'colmac_manuale' ) return;
        if ( ! current_user_can( 'edit_post', $post_id ) ) return;

        // model_id e nome_modello
        if ( isset( $_POST['colmac_model_id'] ) ) {
            update_post_meta( $post_id, '_colmac_model_id', sanitize_text_field( $_POST['colmac_model_id'] ) );
        }
        if ( isset( $_POST['colmac_nome_modello'] ) ) {
            update_post_meta( $post_id, '_colmac_nome_modello', sanitize_text_field( $_POST['colmac_nome_modello'] ) );
        }

        // Foto modello
        if ( isset( $_POST['colmac_model_photo_id'] ) ) {
            $photo_id = absint( $_POST['colmac_model_photo_id'] );
            if ( $photo_id ) {
                update_post_meta( $post_id, '_colmac_model_photo_id', $photo_id );
            } else {
                delete_post_meta( $post_id, '_colmac_model_photo_id' );
            }
        }

        // Documenti
        $documenti = [];
        if ( isset( $_POST['colmac_documenti'] ) && is_array( $_POST['colmac_documenti'] ) ) {
            foreach ( $_POST['colmac_documenti'] as $doc ) {
                $pdf_url = esc_url_raw( $doc['pdf_url'] ?? '' );
                if ( empty( $pdf_url ) ) continue; // Salta righe senza PDF

                $documenti[] = [
                    'tipo'     => sanitize_text_field( $doc['tipo']     ?? '' ),
                    'lingua'   => sanitize_text_field( $doc['lingua']   ?? '' ),
                    'pdf_id'   => absint( $doc['pdf_id']   ?? 0 ),
                    'pdf_url'  => $pdf_url,
                    'pdf_name' => sanitize_text_field( $doc['pdf_name'] ?? '' ),
                ];
            }
        }
        update_post_meta( $post_id, '_colmac_documenti', $documenti );
    }

    // -------------------------------------------------------------------------
    // JS inline — repeater + WP media picker
    // -------------------------------------------------------------------------
    private static function get_inline_js(): string {
        return <<<'JS'
        jQuery(function($) {
            var docList  = $('#colmac-docs-list');
            var template = $('#colmac-doc-template').html();
            var index    = docList.find('.colmac-doc-row').length;

            // ---- Aggiungi riga ----
            $('#colmac-add-doc').on('click', function() {
                var html = template.replace(/__INDEX__/g, index);
                docList.append(html);
                index++;
            });

            // ---- Rimuovi riga ----
            docList.on('click', '.colmac-btn-remove', function() {
                if (docList.find('.colmac-doc-row').length > 1) {
                    $(this).closest('.colmac-doc-row').remove();
                } else {
                    // Ultima riga: svuota solo i valori
                    var row = $(this).closest('.colmac-doc-row');
                    row.find('select').val('');
                    row.find('.colmac-pdf-id, .colmac-pdf-url, .colmac-pdf-name-field').val('');
                    row.find('.colmac-pdf-preview').html('<span class="colmac-pdf-name colmac-pdf-empty">Nessun file selezionato</span>');
                }
            });

            // ---- WP Media Picker ----
            docList.on('click', '.colmac-btn-pick-pdf', function() {
                var btn = $(this);
                var row = btn.closest('.colmac-doc-row');

                var frame = wp.media({
                    title: 'Seleziona PDF',
                    button: { text: 'Usa questo PDF' },
                    library: { type: 'application/pdf' },
                    multiple: false
                });

                frame.on('select', function() {
                    var att = frame.state().get('selection').first().toJSON();
                    row.find('.colmac-pdf-id').val(att.id);
                    row.find('.colmac-pdf-url').val(att.url);
                    row.find('.colmac-pdf-name-field').val(att.filename || att.title);
                    row.find('.colmac-pdf-preview').html(
                        '<span class="colmac-pdf-name">' + (att.filename || att.title) + '</span>' +
                        '<a href="' + att.url + '" target="_blank" class="colmac-pdf-view">Apri</a>'
                    );
                });

                frame.open();
            });

            // ---- Drag & drop per riordinare ----
            if ($.fn.sortable) {
                docList.sortable({ handle: '.colmac-doc-handle', axis: 'y' });
            }

            // ---- Media picker FOTO MODELLO ----
            $('#colmac-btn-pick-photo').on('click', function() {
                var frame = wp.media({
                    title: 'Seleziona foto modello',
                    button: { text: 'Usa questa foto' },
                    library: { type: 'image' },
                    multiple: false
                });
                frame.on('select', function() {
                    var att = frame.state().get('selection').first().toJSON();
                    var url = att.sizes && att.sizes.medium ? att.sizes.medium.url : att.url;
                    $('#colmac_model_photo_id').val(att.id);
                    $('#colmac-photo-preview').html('<img src="' + url + '" alt="Foto modello" />');
                    $('#colmac-btn-remove-photo').show();
                });
                frame.open();
            });

            $('#colmac-btn-remove-photo').on('click', function() {
                $('#colmac_model_photo_id').val('');
                $('#colmac-photo-preview').html('<span class="colmac-photo-empty">Nessuna foto selezionata</span>');
                $(this).hide();
            });
        });
        JS;
    }

    // -------------------------------------------------------------------------
    // CSS inline
    // -------------------------------------------------------------------------
    private static function get_inline_css(): string {
        return '
        .colmac-fields-row { display: flex; gap: 20px; margin-bottom: 4px; }
        .colmac-field { flex: 1; }
        .colmac-field label { display: block; margin-bottom: 6px; }
        .colmac-field .required { color: #d63638; }

        .colmac-doc-row {
            display: flex; align-items: flex-start; gap: 10px;
            padding: 12px; margin-bottom: 8px;
            background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;
        }
        .colmac-doc-handle { cursor: grab; color: #aaa; font-size: 18px; padding-top: 6px; flex-shrink: 0; }
        .colmac-doc-fields { display: flex; flex-wrap: wrap; gap: 10px; flex: 1; align-items: center; }
        .colmac-select { min-width: 180px; height: 34px; }
        .colmac-pdf-picker { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .colmac-pdf-preview { font-size: 13px; }
        .colmac-pdf-name { color: #333; }
        .colmac-pdf-empty { color: #999; font-style: italic; }
        .colmac-pdf-view { margin-left: 8px; font-size: 12px; }
        .colmac-btn-remove {
            background: none; border: none; color: #d63638;
            font-size: 20px; cursor: pointer; flex-shrink: 0; line-height: 1; padding: 4px 8px;
        }
        .colmac-btn-remove:hover { color: #b32d2e; }
        #colmac-add-doc { margin-top: 10px; }

        .colmac-field--photo { margin-top: 16px; border-top: 1px solid #eee; padding-top: 16px; }
        .colmac-field--photo > label { display: block; margin-bottom: 10px; }
        .colmac-photo-wrap { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .colmac-photo-preview {
            width: 160px; height: 120px; border: 2px dashed #ddd; border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            background: #fafafa; overflow: hidden; flex-shrink: 0;
        }
        .colmac-photo-preview img { width: 100%; height: 100%; object-fit: cover; }
        .colmac-photo-empty { color: #999; font-size: 12px; font-style: italic; text-align: center; padding: 8px; }
        .colmac-photo-actions { display: flex; flex-direction: column; gap: 8px; justify-content: center; }
        .colmac-photo-wrap .description { flex-basis: 100%; margin: 4px 0 0; }
        ';
    }
}
