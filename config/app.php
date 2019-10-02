<?php
/**
 * Yii Application Config
 *
 * Edit this file at your own risk!
 *
 * The array returned by this file will get merged with
 * vendor/craftcms/cms/src/config/app.php and app.[web|console].php, when
 * Craft's bootstrap script is defining the configuration for the entire
 * application.
 *
 * You can define custom modules and system components, and even override the
 * built-in system components.
 *
 * If you want to modify the application config for *only* web requests or
 * *only* console requests, create an app.web.php or app.console.php file in
 * your config/ folder, alongside this one.
 */

 return [

     // All environments
     '*' => [
         'modules'   => [
             'site-module' => [
                 'class' => \modules\sitemodule\SiteModule::class,
             ],
         ],
         //'bootstrap' => ['site-module'],
     ],

     // Live (production) environment
     'production'  => [
         'components' => [
             // Default to database 0, so PHP sessions are in a separate database
             'redis' => [
                 'class' => yii\redis\Connection::class,
                 'hostname' => 'localhost',
                 'port' => 6379,
                 'database' => 0,
             ],
             'cache' => [
                 // Use database 1 for live production
                 'class' => yii\redis\Cache::class,
                 'redis' => [
                     'hostname' => 'localhost',
                     'port' => 6379,
                     'database' => 1,
                 ],
             ],
             'session' => function() {
                 $stateKeyPrefix = md5('Craft.'.craft\web\Session::class.'.'.Craft::$app->id);
                 /** @var yii\redis\Session $session */
                 $session = Craft::createObject([
                     'class' => yii\redis\Session::class,
                     'flashParam' => $stateKeyPrefix.'__flash',
                     'name' => Craft::$app->getConfig()->getGeneral()->phpSessionName,
                     'cookieParams' => Craft::cookieConfig(),
                 ]);
                 $session->attachBehaviors([craft\behaviors\SessionBehavior::class]);
                 return $session;
             },
         ],
     ],

     // Staging (pre-production) environment
     'staging'  => [
         // Default to database 0, so PHP sessions are in a separate database
         'components' => [
             'redis' => [
                 'class' => yii\redis\Connection::class,
                 'hostname' => 'localhost',
                 'port' => 6379,
                 'database' => 0,
             ],
             // Use database 2 for staging
             'cache' => [
                 'class' => yii\redis\Cache::class,
                 'defaultDuration' => 86400,
                 'redis' => [
                     'hostname' => 'localhost',
                     'port' => 6379,
                     'database' => 2,
                 ],
             ],
             'session' => function() {
                 $stateKeyPrefix = md5('Craft.'.craft\web\Session::class.'.'.Craft::$app->id);
                 /** @var yii\redis\Session $session */
                 $session = Craft::createObject([
                     'class' => yii\redis\Session::class,
                     'flashParam' => $stateKeyPrefix.'__flash',
                     'name' => Craft::$app->getConfig()->getGeneral()->phpSessionName,
                     'cookieParams' => Craft::cookieConfig(),
                 ]);
                 $session->attachBehaviors([craft\behaviors\SessionBehavior::class]);
                 return $session;
             },
         ],
     ],

     // Local (development) environment
     'dev'  => [
     ],
 ];
