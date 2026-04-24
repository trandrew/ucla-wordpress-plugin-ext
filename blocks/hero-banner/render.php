<?php
/**
 * Hero Banner block render template.
 *
 * @package ucla-wordpress-plugin-ext
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$headline        = isset( $attributes['headline'] ) ? wp_strip_all_tags( $attributes['headline'] ) : '';
$description     = isset( $attributes['description'] ) ? wp_kses_post( $attributes['description'] ) : '';
$button_text     = isset( $attributes['buttonText'] ) ? wp_strip_all_tags( $attributes['buttonText'] ) : '';
$button_url      = isset( $attributes['buttonUrl'] ) ? esc_url_raw( $attributes['buttonUrl'] ) : '#';
$open_in_new_tab = ! empty( $attributes['openInNewTab'] );
$image_url       = isset( $attributes['imageUrl'] ) ? esc_url_raw( $attributes['imageUrl'] ) : '';
$image_alt       = isset( $attributes['imageAlt'] ) ? wp_strip_all_tags( $attributes['imageAlt'] ) : '';

if ( empty( $headline ) ) {
	$headline = 'Hero headline';
}

if ( empty( $button_url ) ) {
	$button_url = '#';
}

$button_rel = $open_in_new_tab ? 'noopener noreferrer' : '';

ob_start();
?>
<section <?php echo get_block_wrapper_attributes( array( 'class' => 'ucla-hero-banner alignfull' ) ); ?>>
	<div class="ucla-hero-banner__inner">
		<div class="ucla-hero-banner__media" aria-hidden="true">
			<?php if ( $image_url ) : ?>
				<img class="ucla-hero-banner__image" src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( $image_alt ); ?>" />
			<?php endif; ?>
		</div>
		<div class="ucla-hero-banner__content">
			<h2 class="ucla-hero-banner__headline"><?php echo esc_html( $headline ); ?></h2>
			<?php if ( $description ) : ?>
				<p class="ucla-hero-banner__description"><?php echo esc_html( $description ); ?></p>
			<?php endif; ?>
			<?php if ( $button_text ) : ?>
				<a
					class="ucla-hero-banner__button"
					href="<?php echo esc_url( $button_url ); ?>"
					<?php echo $open_in_new_tab ? 'target="_blank"' : ''; ?>
					<?php echo $button_rel ? 'rel="' . esc_attr( $button_rel ) . '"' : ''; ?>
				>
					<?php echo esc_html( $button_text ); ?>
				</a>
			<?php endif; ?>
		</div>
	</div>
</section>
<?php
return ob_get_clean();
