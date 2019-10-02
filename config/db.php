<?php
/**
 * Database Configuration
 *
 * All of your system's database configuration settings go in here.
 * You can see a list of the default settings in src/config/DbConfig.php
 */

return [

    // All environments
    '*' => [
      'driver' => getenv('DB_DRIVER'),
      'server' => getenv('DB_SERVER'),
      'user' => getenv('DB_USER'),
      'password' => getenv('DB_PASSWORD'),
      'database' => getenv('DB_DATABASE'),
      'schema' => getenv('DB_SCHEMA'),
      'tablePrefix' => getenv('DB_TABLE_PREFIX'),
      'port' => getenv('DB_PORT')
    ],

    // Live (production) environment
    'production'  => [
    ],

    // Staging (pre-production) environment
    'staging'  => [
    ],

    // Local (development) environment
    'dev'  => [
    ],
];
