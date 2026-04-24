<?php
/**
 * Featured Card block render template.
 *
 * @package ucla-wordpress-plugin-ext
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$post_type   = isset( $attributes['postType'] ) ? sanitize_key( $attributes['postType'] ) : 'post';
$show_title  = ! isset( $attributes['showTitle'] ) || (bool) $attributes['showTitle'];
$show_author = ! isset( $attributes['showAuthor'] ) || (bool) $attributes['showAuthor'];
$show_excerpt = ! isset( $attributes['showExcerpt'] ) || (bool) $attributes['showExcerpt'];
$show_source = ! isset( $attributes['showSource'] ) || (bool) $attributes['showSource'];
$show_date   = ! isset( $attributes['showDate'] ) || (bool) $attributes['showDate'];
$show_overlay = ! isset( $attributes['showOverlay'] ) || (bool) $attributes['showOverlay'];
$category_id = isset( $attributes['selectedCategoryId'] ) ? absint( $attributes['selectedCategoryId'] ) : 0;
$media_size  = isset( $attributes['mediaSize'] ) ? sanitize_key( $attributes['mediaSize'] ) : 'full';
$custom_media_size = isset( $attributes['customMediaSize'] ) ? sanitize_key( $attributes['customMediaSize'] ) : '';

$allowed_media_sizes = array_merge( get_intermediate_image_sizes(), array( 'full' ) );
if ( $custom_media_size ) {
	$media_size = $custom_media_size;
}
if ( ! in_array( $media_size, $allowed_media_sizes, true ) ) {
	$media_size = 'full';
}

$post_id = isset( $attributes['selectedPostId'] ) ? absint( $attributes['selectedPostId'] ) : 0;
if ( ! $post_id ) {
	$args = array(
		'numberposts'  => 1,
		'post_type'    => $post_type,
		'post_status'  => 'publish',
		'has_password' => false,
	);

	if ( $category_id ) {
		$args['cat'] = $category_id;
	}

	$recent_posts = wp_get_recent_posts( $args );
	if ( ! empty( $recent_posts ) ) {
		$post_id = absint( $recent_posts[0]['ID'] );
	}
}

if ( ! $post_id ) {
	return '';
}

$post = get_post( $post_id );
if ( ! $post || 'publish' !== $post->post_status || ! empty( $post->post_password ) ) {
	return '';
}

$title   = $show_title ? get_the_title( $post_id ) : '';
$author  = $show_author ? get_the_author_meta( 'display_name', $post->post_author ) : '';
$excerpt = $show_excerpt ? get_the_excerpt( $post_id ) : '';
$source  = $show_source ? sprintf( 'Source: %s', get_bloginfo( 'name' ) ) : '';
$date    = $show_date ? get_the_date( 'F j, Y', $post_id ) : '';

ob_start();
?>
<article <?php echo get_block_wrapper_attributes( array( 'class' => 'ucla-card ucla-card__story-featured' . ( $show_overlay ? '' : ' ucla-featured-card--no-overlay' ) ) ); ?>>
	<a href="<?php echo esc_url( get_permalink( $post_id ) ); ?>" aria-label="<?php echo esc_attr( sprintf( 'Read full article: %s', $title ) ); ?>">
		<?php echo get_the_post_thumbnail( $post_id, $media_size, array( 'class' => 'ucla-card__story-featured-image' ) ); ?>
	</a>
	<div class="ucla-card__story-featured-body">
		<?php if ( $date ) : ?>
			<p class="ucla-card__date"><?php echo esc_html( $date ); ?></p>
		<?php endif; ?>
		<?php if ( $title ) : ?>
			<h3 class="ucla-card__story-featured-title">
				<a class="link" href="<?php echo esc_url( get_permalink( $post_id ) ); ?>" aria-label="<?php echo esc_attr( sprintf( 'Read full article: %s', $title ) ); ?>">
					<?php echo esc_html( $title ); ?>
				</a>
			</h3>
		<?php endif; ?>
		<?php if ( $author ) : ?>
			<p class="ucla-card__story-author"><?php echo esc_html( sprintf( 'By %s', $author ) ); ?></p>
		<?php endif; ?>
		<?php if ( $excerpt ) : ?>
			<p class="ucla-card__story-featured-summary"><?php echo wp_kses_post( $excerpt ); ?></p>
		<?php endif; ?>
		<?php if ( $source ) : ?>
			<p class="ucla-card__story-featured-source"><?php echo esc_html( $source ); ?></p>
		<?php endif; ?>
	</div>
</article>
<?php

return ob_get_clean();
