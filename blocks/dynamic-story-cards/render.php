<?php
/**
 * Dynamic Story Cards block render template.
 *
 * @package ucla-wordpress-plugin-ext
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$posts_to_show = isset( $attributes['postsToShow'] ) ? absint( $attributes['postsToShow'] ) : 5;
$post_type     = isset( $attributes['postType'] ) ? sanitize_key( $attributes['postType'] ) : 'post';
$categories    = isset( $attributes['categories'] ) && is_array( $attributes['categories'] )
	? array_map( 'absint', $attributes['categories'] )
	: array();
$tags          = isset( $attributes['tags'] ) && is_array( $attributes['tags'] )
	? array_map( 'absint', $attributes['tags'] )
	: array();
$show_date        = ! isset( $attributes['showDate'] ) || (bool) $attributes['showDate'];
$show_title       = ! isset( $attributes['showTitle'] ) || (bool) $attributes['showTitle'];
$show_author      = ! isset( $attributes['showAuthor'] ) || (bool) $attributes['showAuthor'];
$show_description = ! isset( $attributes['showDescription'] ) || (bool) $attributes['showDescription'];
$show_image       = ! isset( $attributes['showImage'] ) || (bool) $attributes['showImage'];
$thumbnail_size   = isset( $attributes['thumbnailSize'] ) ? sanitize_key( $attributes['thumbnailSize'] ) : 'thumbnail';
$custom_thumbnail_size = isset( $attributes['customThumbnailSize'] ) ? sanitize_key( $attributes['customThumbnailSize'] ) : '';
$custom_class     = isset( $attributes['customClass'] ) ? sanitize_html_class( $attributes['customClass'] ) : '';
$offset           = isset( $attributes['offset'] ) ? absint( $attributes['offset'] ) : 0;

$allowed_sizes = array_merge( get_intermediate_image_sizes(), array( 'full' ) );
if ( $custom_thumbnail_size ) {
	$thumbnail_size = $custom_thumbnail_size;
}
if ( ! in_array( $thumbnail_size, $allowed_sizes, true ) ) {
	$thumbnail_size = 'thumbnail';
}

$args = array(
	'posts_per_page' => min( max( $posts_to_show, 1 ), 20 ),
	'post_type'      => $post_type,
	'offset'         => min( $offset, 100 ),
	'post_status'    => 'publish',
	'has_password'   => false,
);

if ( ! empty( $categories ) ) {
	$args['category__in'] = $categories;
}

if ( ! empty( $tags ) ) {
	$args['tag__in'] = $tags;
}

$query = new WP_Query( $args );

ob_start();
?>
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'ucla ucla-cards-container' ) ); ?>>
	<?php if ( $query->have_posts() ) : ?>
		<?php while ( $query->have_posts() ) : ?>
			<?php
			$query->the_post();
			if ( post_password_required() ) {
				continue;
			}
			$image_url = $show_image ? get_the_post_thumbnail_url( get_the_ID(), $thumbnail_size ) : '';
			?>
			<article class="ucla-card ucla-card__story <?php echo esc_attr( $custom_class ); ?>">
				<?php if ( $image_url ) : ?>
					<a class="story-card-image-link" href="<?php echo esc_url( get_permalink() ); ?>">
						<img class="ucla-card__image" src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( get_the_title() ); ?>" />
					</a>
				<?php endif; ?>
				<div class="ucla-card__body">
					<?php if ( $show_date ) : ?>
						<p class="ucla-card__date"><?php echo esc_html( get_the_date() ); ?></p>
					<?php endif; ?>
					<?php if ( $show_title ) : ?>
						<h3 class="ucla-card__title">
							<a class="ucla-card__title-link" href="<?php echo esc_url( get_permalink() ); ?>">
								<?php echo esc_html( get_the_title() ); ?>
							</a>
						</h3>
					<?php endif; ?>
					<?php if ( $show_author ) : ?>
						<p class="ucla-card__author"><?php echo esc_html( sprintf( 'By %s', get_the_author() ) ); ?></p>
					<?php endif; ?>
					<?php if ( $show_description ) : ?>
						<p class="ucla-card__description"><?php echo esc_html( get_the_excerpt() ); ?></p>
					<?php endif; ?>
				</div>
			</article>
		<?php endwhile; ?>
		<?php wp_reset_postdata(); ?>
	<?php endif; ?>
</div>
<?php

return ob_get_clean();
