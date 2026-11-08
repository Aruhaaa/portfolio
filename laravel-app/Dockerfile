# Runs the portfolio in a container (FrankenPHP = PHP + the Caddy web server in one program).
# Vercel's container runtime builds this file; Render and most other hosts can use it as it is.
# It follows Vercel's own Laravel guide: https://vercel.com/kb/guide/laravel-php-with-docker

FROM dunglas/frankenphp:1-php8.4-bookworm AS base

# pdo_mysql: MySQL / TiDB. gd: shrinks screenshots when they are uploaded. intl, zip: Laravel and Composer.
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && install-php-extensions intl zip pdo_mysql gd \
    && printf 'memory_limit=256M\nupload_max_filesize=4M\npost_max_size=6M\n' > "$PHP_INI_DIR/conf.d/zz-portfolio.ini"

WORKDIR /app

FROM base AS dependencies

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --optimize-autoloader \
    --prefer-dist

COPY . .
RUN mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && composer dump-autoload --no-dev --classmap-authoritative \
    && php artisan package:discover --ansi \
    && php artisan event:cache \
    && php artisan view:cache

FROM base AS runtime

COPY --from=dependencies --chown=www-data:www-data /app /app
COPY --chown=www-data:www-data Caddyfile /etc/frankenphp/Caddyfile

RUN setcap CAP_NET_BIND_SERVICE=+eip /usr/local/bin/frankenphp \
    && chown -R www-data:www-data /config/caddy /data/caddy

# Safe defaults for a public site. Anything set on the host (APP_KEY, DB_*) overrides these.
#   SESSION_DRIVER=cookie  the login lives in a cookie, so it survives restarts and works on any number of servers
#   CACHE_STORE=database   the login limit needs a store that all servers share
#   MYSQL_ATTR_SSL_CA      TiDB Cloud only accepts TLS connections; this is the system certificate list
#   Running this container on plain http (for a local test)? Add -e SESSION_SECURE_COOKIE=false
ENV PORT=80 \
    APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    CACHE_STORE=database \
    SESSION_DRIVER=cookie \
    SESSION_SECURE_COOKIE=true \
    QUEUE_CONNECTION=sync \
    MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-certificates.crt

USER www-data

CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
