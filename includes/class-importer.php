<?php
defined( 'ABSPATH' ) || exit;

/**
 * Importatore massivo PDF — naming convention.
 *
 * Convenzione nome file:
 *   {MODEL_ID}__{tipo_documento}__{lingua}.pdf
 *
 * Esempi:
 *   BETOMIX-350RS__catalogo__it.pdf
 *   BETOMIX-350RS__libretto_assistenza__en.pdf
 *   COMPACTMIX-140S__esploso__it.pdf
 *   PROMIX-60__catalogo__it.pdf
 *
 * Flusso:
 *   1. Rinomina i PDF secondo la convenzione
 *   2. Vai su Manuali → Carica PDF
 *   3. Trascina tutti i PDF nell'area di upload
 *   4. Il plugin crea/aggiorna i manuali automaticamente
 */
class Colmac_Importer {

    // Mappa prefisso model_id → [ linea, tipo_macchina ]
    // Brand reali verificati su colmac-italia.com (aprile 2026)
    const LINEA_MAP = [
        // Motocarriole — linea TUCANO
        'TUCANO'     => [ 'Tucano',     'Motocarriole' ],
        // Mini Dumper — linea PELLICANO
        'PELLICANO'  => [ 'Pellicano',  'Mini Dumper' ],
        // Miniescavatori — linea AIRONE
        'AIRONE'     => [ 'Airone',     'Miniescavatori' ],
        // Minipale — linea CONDOR
        'CONDOR'     => [ 'Condor',     'Minipale' ],
        // Betoniere — linee BETOMIX, COMPACTMIX, HOBBYMIX
        'BETOMIX'    => [ 'BetoMix',    'Betoniere' ],
        'COMPACTMIX' => [ 'CompactMix', 'Betoniere' ],
        'HOBBYMIX'   => [ 'HobbyMix',   'Betoniere' ],
        // Mescolatori — linee PROMIX, ULTRAMIX
        'PROMIX'     => [ 'ProMix',     'Mescolatori' ],
        'ULTRAMIX'   => [ 'UltraMix',   'Mescolatori' ],
        // Martelli demolitori — linea MAGNITUDO
        'MAGNITUDO'  => [ 'Magnitudo',  'Martelli' ],
    ];

    const TIPO_LABELS = [
        'libretto_assistenza' => 'Libretto Assistenza',
        'catalogo'            => 'Catalogo',
        'esploso'             => 'Esploso',
        'dichiarazione_ce'    => 'Dichiarazione CE',
        'scheda_tecnica'      => 'Scheda Tecnica',
    ];

    const LINGUA_LABELS = [
        'it' => 'Italiano', 'en' => 'English', 'fr' => 'Français',
        'de' => 'Deutsch',  'es' => 'Español', 'pt' => 'Português',
    ];

    public static function init() {
        add_action( 'admin_menu',           [ __CLASS__, 'add_menu' ] );
        add_action( 'wp_ajax_colmac_upload_pdf', [ __CLASS__, 'handle_upload' ] );
    }

    // -------------------------------------------------------------------------
    // Menu
    // -------------------------------------------------------------------------
    public static function add_menu() {
        add_submenu_page(
            'edit.php?post_type=colmac_manuale',
            'Carica PDF',
            'Carica PDF',
            'manage_options',
            'colmac-upload-pdf',
            [ __CLASS__, 'render_page' ]
        );
    }

    // -------------------------------------------------------------------------
    // Pagina admin
    // -------------------------------------------------------------------------
    public static function render_page() {
        $nonce = wp_create_nonce( 'colmac_upload_pdf' );
        $ajax  = admin_url( 'admin-ajax.php' );
        ?>
        <div class="wrap">
            <h1>Carica PDF manuali</h1>

            <div style="max-width:780px">

                <div class="notice notice-info" style="margin:16px 0">
                    <p><strong>Convenzione nome file:</strong>
                    <code>MODEL_ID__tipo_documento__lingua.pdf</code></p>
                    <p style="margin-top:6px">Esempi:</p>
                    <ul style="list-style:disc;margin-left:20px">
                        <li><code>BETOMIX-350RS__catalogo__it.pdf</code></li>
                        <li><code>BETOMIX-350RS__libretto_assistenza__en.pdf</code></li>
                        <li><code>COMPACTMIX-140S__esploso__it.pdf</code></li>
                        <li><code>PROMIX-60__catalogo__it.pdf</code></li>
                    </ul>
                    <p style="margin-top:8px">
                        <strong>Tipi documento validi:</strong>
                        catalogo, libretto_assistenza, esploso, dichiarazione_ce, scheda_tecnica<br>
                        <strong>Lingue valide:</strong> it, en, fr, de, es, pt
                    </p>
                </div>

                <?php // Dropzone ?>
                <div id="colmac-dropzone">
                    <div id="colmac-drop-inner">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <p>Trascina qui i PDF oppure</p>
                        <label class="button button-primary" for="colmac-file-input">Seleziona file</label>
                        <input type="file" id="colmac-file-input" accept=".pdf,application/pdf" multiple style="display:none" />
                        <p style="color:#aaa;font-size:13px;margin-top:8px">Puoi caricare più file contemporaneamente</p>
                    </div>
                </div>

                <?php // Progress list ?>
                <div id="colmac-upload-list" style="display:none;margin-top:24px">
                    <h3 style="margin-bottom:12px">Risultati importazione</h3>
                    <table class="widefat striped">
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Modello</th>
                                <th>Tipo</th>
                                <th>Lingua</th>
                                <th>Esito</th>
                            </tr>
                        </thead>
                        <tbody id="colmac-upload-rows"></tbody>
                    </table>
                    <p id="colmac-upload-summary" style="margin-top:12px;font-weight:600"></p>
                </div>

            </div>
        </div>

        <style>
        #colmac-dropzone {
            border: 3px dashed #c3c4c7;
            border-radius: 8px;
            padding: 48px 24px;
            text-align: center;
            background: #fafafa;
            cursor: pointer;
            transition: border-color .2s, background .2s;
        }
        #colmac-dropzone.dragover {
            border-color: #F5A623;
            background: #fff8ee;
        }
        #colmac-drop-inner p { color: #666; margin: 12px 0 8px; }
        #colmac-upload-rows td { vertical-align: middle; }
        .colmac-status-ok      { color: #008a00; font-weight: 600; }
        .colmac-status-updated { color: #0073aa; font-weight: 600; }
        .colmac-status-error   { color: #d63638; font-weight: 600; }
        .colmac-status-loading { color: #aaa; }
        .colmac-spinner {
            display: inline-block; width: 14px; height: 14px;
            border: 2px solid #ccc; border-top-color: #666;
            border-radius: 50%; animation: spin .6s linear infinite;
            vertical-align: middle; margin-right: 4px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        </style>

        <script>
        (function() {
            var ajaxUrl  = <?php echo json_encode( $ajax ); ?>;
            var nonce    = <?php echo json_encode( $nonce ); ?>;
            var dropzone = document.getElementById('colmac-dropzone');
            var fileInput= document.getElementById('colmac-file-input');
            var list     = document.getElementById('colmac-upload-list');
            var tbody    = document.getElementById('colmac-upload-rows');
            var summary  = document.getElementById('colmac-upload-summary');

            var stats = { ok: 0, updated: 0, error: 0, total: 0 };

            // Drag & drop
            dropzone.addEventListener('dragover',  function(e) { e.preventDefault(); dropzone.classList.add('dragover'); });
            dropzone.addEventListener('dragleave', function()  { dropzone.classList.remove('dragover'); });
            dropzone.addEventListener('drop', function(e) {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                handleFiles(e.dataTransfer.files);
            });
            dropzone.addEventListener('click', function(e) {
                if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
                    fileInput.click();
                }
            });
            fileInput.addEventListener('change', function() { handleFiles(this.files); });

            function handleFiles(files) {
                if (!files.length) return;
                list.style.display = 'block';
                stats = { ok: 0, updated: 0, error: 0, total: files.length };
                updateSummary();

                Array.from(files).forEach(function(file) {
                    var tr = addRow(file.name);
                    uploadFile(file, tr);
                });
            }

            function addRow(filename) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td><code>' + escHtml(filename) + '</code></td>' +
                    '<td class="col-model">—</td>' +
                    '<td class="col-tipo">—</td>' +
                    '<td class="col-lingua">—</td>' +
                    '<td class="col-esito colmac-status-loading"><span class="colmac-spinner"></span> Caricamento...</td>';
                tbody.appendChild(tr);
                return tr;
            }

            function uploadFile(file, tr) {
                var fd = new FormData();
                fd.append('action', 'colmac_upload_pdf');
                fd.append('nonce',  nonce);
                fd.append('pdf',    file, file.name);

                fetch(ajaxUrl, { method: 'POST', body: fd })
                    .then(function(r) { return r.json(); })
                    .then(function(res) { renderResult(tr, res); })
                    .catch(function()  { renderError(tr, 'Errore di rete'); });
            }

            function renderResult(tr, res) {
                tr.querySelector('.col-model').textContent  = res.model_id  || '—';
                tr.querySelector('.col-tipo').textContent   = res.tipo      || '—';
                tr.querySelector('.col-lingua').textContent = res.lingua    || '—';

                var cell = tr.querySelector('.col-esito');
                if (res.success) {
                    var isNew = res.action === 'created';
                    cell.className = 'col-esito ' + (isNew ? 'colmac-status-ok' : 'colmac-status-updated');
                    cell.textContent = isNew ? '✓ Creato' : '↻ Aggiornato';
                    if (isNew) stats.ok++; else stats.updated++;
                } else {
                    renderError(tr, res.error || 'Errore sconosciuto');
                }
                updateSummary();
            }

            function renderError(tr, msg) {
                tr.querySelector('.col-esito').className = 'col-esito colmac-status-error';
                tr.querySelector('.col-esito').textContent = '✗ ' + msg;
                stats.error++;
                updateSummary();
            }

            function updateSummary() {
                var done = stats.ok + stats.updated + stats.error;
                summary.textContent = done + '/' + stats.total + ' elaborati' +
                    (stats.ok      ? ' — ' + stats.ok      + ' creati'     : '') +
                    (stats.updated ? ' — ' + stats.updated + ' aggiornati' : '') +
                    (stats.error   ? ' — ' + stats.error   + ' errori'     : '');
            }

            function escHtml(s) {
                return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            }
        })();
        </script>
        <?php
    }

    // -------------------------------------------------------------------------
    // AJAX handler — riceve un singolo PDF, lo processa
    // -------------------------------------------------------------------------
    public static function handle_upload() {
        check_ajax_referer( 'colmac_upload_pdf', 'nonce' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( [ 'error' => 'Permesso negato.' ] );
        }

        if ( empty( $_FILES['pdf']['tmp_name'] ) ) {
            wp_send_json_error( [ 'error' => 'Nessun file ricevuto.' ] );
        }

        $filename  = sanitize_file_name( $_FILES['pdf']['name'] );
        $parsed    = self::parse_filename( $filename );

        if ( is_wp_error( $parsed ) ) {
            wp_send_json( array_merge(
                [ 'success' => false, 'error' => $parsed->get_error_message() ],
                [ 'model_id' => '', 'tipo' => '', 'lingua' => '' ]
            ) );
        }

        [ 'model_id' => $model_id, 'tipo' => $tipo, 'lingua' => $lingua ] = $parsed;

        // Carica in Media Library
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $upload = wp_handle_upload( $_FILES['pdf'], [ 'test_form' => false ] );
        if ( isset( $upload['error'] ) ) {
            wp_send_json( [
                'success'  => false,
                'error'    => $upload['error'],
                'model_id' => $model_id,
                'tipo'     => self::TIPO_LABELS[ $tipo ] ?? $tipo,
                'lingua'   => self::LINGUA_LABELS[ $lingua ] ?? $lingua,
            ] );
        }

        // Crea attachment
        $att_id = wp_insert_attachment( [
            'post_title'     => $filename,
            'post_mime_type' => 'application/pdf',
            'post_status'    => 'inherit',
            'post_name'      => sanitize_title( pathinfo( $filename, PATHINFO_FILENAME ) ),
        ], $upload['file'] );

        if ( is_wp_error( $att_id ) ) {
            wp_send_json( [
                'success'  => false,
                'error'    => 'Errore creazione attachment.',
                'model_id' => $model_id,
                'tipo'     => self::TIPO_LABELS[ $tipo ] ?? $tipo,
                'lingua'   => self::LINGUA_LABELS[ $lingua ] ?? $lingua,
            ] );
        }

        // Crea/aggiorna manuale
        $action  = self::upsert_manuale( $model_id, $tipo, $lingua, $att_id, $upload['url'] );

        wp_send_json( [
            'success'  => true,
            'action'   => $action,
            'model_id' => $model_id,
            'tipo'     => self::TIPO_LABELS[ $tipo ] ?? $tipo,
            'lingua'   => self::LINGUA_LABELS[ $lingua ] ?? $lingua,
        ] );
    }

    // -------------------------------------------------------------------------
    // Parsing nome file → model_id, tipo, lingua
    // -------------------------------------------------------------------------
    private static function parse_filename( string $filename ): array|WP_Error {
        $base  = pathinfo( $filename, PATHINFO_FILENAME ); // senza .pdf
        $parts = explode( '__', $base );

        if ( count( $parts ) !== 3 ) {
            return new WP_Error( 'bad_name',
                'Nome non valido. Usa: MODEL_ID__tipo__lingua.pdf'
            );
        }

        [ $model_id, $tipo, $lingua ] = array_map( 'strtolower', $parts );
        $model_id = strtoupper( $parts[0] ); // model_id sempre uppercase

        if ( ! array_key_exists( $tipo, self::TIPO_LABELS ) ) {
            return new WP_Error( 'bad_tipo',
                "Tipo documento non valido: \"{$tipo}\". Validi: " . implode( ', ', array_keys( self::TIPO_LABELS ) )
            );
        }

        if ( ! array_key_exists( $lingua, self::LINGUA_LABELS ) ) {
            return new WP_Error( 'bad_lingua',
                "Lingua non valida: \"{$lingua}\". Valide: " . implode( ', ', array_keys( self::LINGUA_LABELS ) )
            );
        }

        return compact( 'model_id', 'tipo', 'lingua' );
    }

    // -------------------------------------------------------------------------
    // Crea o aggiorna un manuale, aggiunge il documento
    // -------------------------------------------------------------------------
    private static function upsert_manuale(
        string $model_id,
        string $tipo,
        string $lingua,
        int    $att_id,
        string $pdf_url
    ): string {
        // Cerca post esistente
        $existing = self::find_post_by_model_id( $model_id );

        if ( $existing ) {
            $post_id = $existing;
            $action  = 'updated';
        } else {
            $nome    = self::model_id_to_name( $model_id );
            $post_id = wp_insert_post( [
                'post_title'  => $nome,
                'post_name'   => sanitize_title( $model_id ),
                'post_type'   => 'colmac_manuale',
                'post_status' => 'publish',
            ] );
            update_post_meta( $post_id, '_colmac_model_id',     $model_id );
            update_post_meta( $post_id, '_colmac_nome_modello', $nome );
            $action = 'created';
        }

        // Tassonomie: assegna sempre se mancanti
        [ $linea, $tipo_macchina ] = self::detect_linea( $model_id );
        $has_linea   = ! empty( wp_get_post_terms( $post_id, 'colmac_linea' ) );
        $has_macchina = ! empty( wp_get_post_terms( $post_id, 'colmac_tipo_macchina' ) );
        if ( ! $has_linea   && $linea )        self::set_taxonomy( $post_id, 'colmac_linea',        $linea );
        if ( ! $has_macchina && $tipo_macchina ) self::set_taxonomy( $post_id, 'colmac_tipo_macchina', $tipo_macchina );

        // Aggiungi documento (evita duplicati)
        $documenti = get_post_meta( $post_id, '_colmac_documenti', true ) ?: [];
        foreach ( $documenti as $d ) {
            if ( $d['pdf_id'] == $att_id ) return $action; // già presente
        }

        $documenti[] = [
            'tipo'     => $tipo,
            'lingua'   => $lingua,
            'pdf_id'   => $att_id,
            'pdf_url'  => $pdf_url,
            'pdf_name' => basename( $pdf_url ),
        ];
        update_post_meta( $post_id, '_colmac_documenti', $documenti );

        return $action;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static function find_post_by_model_id( string $model_id ): ?int {
        $q = new WP_Query( [
            'post_type'      => 'colmac_manuale',
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_query'     => [ [ 'key' => '_colmac_model_id', 'value' => $model_id ] ],
        ] );
        return $q->posts[0] ?? null;
    }

    private static function detect_linea( string $model_id ): array {
        foreach ( self::LINEA_MAP as $prefix => $data ) {
            if ( str_starts_with( $model_id, $prefix ) ) return $data;
        }
        return [ '', '' ];
    }

    private static function model_id_to_name( string $model_id ): string {
        // BETOMIX-350RS → BetoMix 350 RS
        foreach ( self::LINEA_MAP as $prefix => [ $linea ] ) {
            if ( str_starts_with( $model_id, $prefix ) ) {
                $rest = substr( $model_id, strlen( $prefix ) );
                $rest = ltrim( $rest, '-' );
                // Separa lettere da numeri: 350RS → 350 RS
                $rest = preg_replace( '/([0-9]+)([A-Z]+)/', '$1 $2', $rest );
                return $linea . ' ' . $rest;
            }
        }
        return $model_id;
    }

    private static function set_taxonomy( int $post_id, string $taxonomy, string $term_name ) {
        if ( empty( $term_name ) ) return;
        $term = get_term_by( 'name', $term_name, $taxonomy );
        if ( ! $term ) {
            $res  = wp_insert_term( $term_name, $taxonomy );
            $term_id = is_wp_error( $res ) ? null : $res['term_id'];
        } else {
            $term_id = $term->term_id;
        }
        if ( $term_id ) wp_set_post_terms( $post_id, [ $term_id ], $taxonomy );
    }
}
