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
$thumbnail_width  = isset( $attributes['thumbnailWidth'] ) ? absint( $attributes['thumbnailWidth'] ) : 0;
$thumbnail_height = isset( $attributes['thumbnailHeight'] ) ? absint( $attributes['thumbnailHeight'] ) : 0;
$thumbnail_fit    = isset( $attributes['thumbnailFit'] ) ? sanitize_key( $attributes['thumbnailFit'] ) : 'cover';
$custom_class     = isset( $attributes['customClass'] ) ? sanitize_html_class( $attributes['customClass'] ) : '';
$card_background_color = isset( $attributes['cardBackgroundColor'] ) ? sanitize_hex_color( $attributes['cardBackgroundColor'] ) : '';
$enable_animations = ! isset( $attributes['enableAnimations'] ) || (bool) $attributes['enableAnimations'];
$offset           = isset( $attributes['offset'] ) ? absint( $attributes['offset'] ) : 0;

$allowed_sizes = array_merge( get_intermediate_image_sizes(), array( 'full' ) );
if ( ! in_array( $thumbnail_size, $allowed_sizes, true ) ) {
	$thumbnail_size = 'thumbnail';
}
if ( ! in_array( $thumbnail_fit, array( 'cover', 'contain', 'crop' ), true ) ) {
	$thumbnail_fit = 'cover';
}
$object_fit = 'contain' === $thumbnail_fit ? 'contain' : 'cover';

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
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'ucla ucla-cards-container ucla-dynamic-story-cards' ) ); ?>>
	<?php if ( $query->have_posts() ) : ?>
		<?php while ( $query->have_posts() ) : ?>
			<?php
			$query->the_post();
			if ( post_password_required() ) {
				continue;
			}
			$image_url = '';
			if ( $show_image ) {
				$thumbnail_id = get_post_thumbnail_id( get_the_ID() );
				if ( $thumbnail_id ) {
					$selected_size = image_get_intermediate_size( $thumbnail_id, $thumbnail_size );
					if ( ! empty( $selected_size['url'] ) ) {
						$image_url = $selected_size['url'];
					} else {
						$thumbnail_fallback = image_get_intermediate_size( $thumbnail_id, 'thumbnail' );
						if ( ! empty( $thumbnail_fallback['url'] ) ) {
							$image_url = $thumbnail_fallback['url'];
						} else {
							$medium_fallback = image_get_intermediate_size( $thumbnail_id, 'medium' );
							if ( ! empty( $medium_fallback['url'] ) ) {
								$image_url = $medium_fallback['url'];
							} else {
								$full_fallback = wp_get_attachment_image_src( $thumbnail_id, 'full' );
								$image_url = ! empty( $full_fallback[0] ) ? $full_fallback[0] : '';
							}
						}
					}
				}
			}
			$card_classes = trim(
				sprintf(
					'ucla-card ucla-card__story %s %s',
					$custom_class,
					$enable_animations ? 'ucla-card--animate' : ''
				)
			);
			$image_styles = array(
				sprintf( 'object-fit: %s', $object_fit ),
				'object-position: center center',
				'max-width: 100%',
			);
			if ( $thumbnail_width > 0 ) {
				$image_styles[] = sprintf( 'width: %dpx', $thumbnail_width );
			}
			if ( $thumbnail_height > 0 ) {
				$image_styles[] = sprintf( 'height: %dpx', $thumbnail_height );
			}
			$image_style_attr = implode( '; ', $image_styles ) . ';';
			?>
			<?php $card_style_attr = $card_background_color ? sprintf( '--ucla-dynamic-card-bg:%s;', $card_background_color ) : ''; ?>
			<article class="<?php echo esc_attr( $card_classes ); ?>"<?php echo $card_style_attr ? ' style="' . esc_attr( $card_style_attr ) . '"' : ''; ?>>
				<?php if ( $image_url ) : ?>
					<a class="story-card-image-link" href="<?php echo esc_url( get_permalink() ); ?>">
						<img class="ucla-card__image" style="<?php echo esc_attr( $image_style_attr ); ?>" src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( get_the_title() ); ?>" />
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
