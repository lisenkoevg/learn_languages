<?php
$old_error_log = ini_get('error_log');
ini_set('error_log', '');
error_log('line written to stderr');
ini_set('error_log', $old_error_log);

