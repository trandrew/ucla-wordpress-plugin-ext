<?php
/**
 * UCLA Events List block render template.
 *
 * @package ucla-wordpress-plugin-ext
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'tribe_get_events' ) ) {
	return '';
}

/**
 * Sanitize supported background color values for this block.
 *
 * @param mixed $value Raw background color attribute value.
 * @return string
 */
if ( ! function_exists( 'ucla_plugin_ext_sanitize_tec_background_color' ) ) {
	function ucla_plugin_ext_sanitize_tec_background_color( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$color = trim( $value );
		if ( '' === $color ) {
			return '';
		}

		$hex = sanitize_hex_color( $color );
		if ( $hex ) {
			return $hex;
		}

		if ( 'transparent' === strtolower( $color ) ) {
			return 'transparent';
		}

		$is_rgb = 1 === preg_match(
			'/^rgb\(\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*\)$/i',
			$color
		);
		if ( $is_rgb ) {
			return $color;
		}

		$is_rgba = 1 === preg_match(
			'/^rgba\(\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:0|1|0?\.\d+)\s*\)$/i',
			$color
		);
		if ( $is_rgba ) {
			return $color;
		}

		return '';
	}
}

$defaults = array(
	'eyebrow'       => 'Events & Programs',
	'heading'       => "What's happening at UCLA",
	'viewAllLabel'  => 'View all events',
	'viewAllUrl'    => '',
	'count'         => 4,
	'layout'        => 'expanded',
	'dateRange'     => 'upcoming',
	'startDate'     => '',
	'endDate'       => '',
	'categoryIds'   => array(),
	'venueIds'      => array(),
	'featuredOnly'  => false,
	'showDateBlock' => true,
	'showMeta'      => true,
	'showHeading'   => true,
	'backgroundColor' => '',
);

$attrs = wp_parse_args( is_array( $attributes ) ? $attributes : array(), $defaults );

$layout = in_array( $attrs['layout'], array( 'expanded', 'compact' ), true ) ? $attrs['layout'] : 'expanded';
$date_range = in_array( $attrs['dateRange'], array( 'upcoming', 'this_month', 'next_30', 'custom' ), true ) ? $attrs['dateRange'] : 'upcoming';
$count = max( 1, (int) $attrs['count'] );
$background_color = ucla_plugin_ext_sanitize_tec_background_color( $attrs['backgroundColor'] );

$query_args = array(
	'posts_per_page' => $count,
	'post_status'    => 'publish',
);

$timezone = wp_timezone();
$now = new DateTimeImmutable( 'now', $timezone );
$today = $now->setTime( 0, 0, 0 );

if ( 'this_month' === $date_range ) {
	$start = $today->modify( 'first day of this month' )->setTime( 0, 0, 0 );
	$end = $today->modify( 'last day of this month' )->setTime( 23, 59, 59 );
	$query_args['start_date'] = $start->format( 'Y-m-d H:i:s' );
	$query_args['end_date'] = $end->format( 'Y-m-d H:i:s' );
} elseif ( 'next_30' === $date_range ) {
	$query_args['start_date'] = $now->format( 'Y-m-d H:i:s' );
	$query_args['end_date'] = $now->modify( '+30 days' )->format( 'Y-m-d H:i:s' );
} elseif ( 'custom' === $date_range ) {
	if ( ! empty( $attrs['startDate'] ) ) {
		$query_args['start_date'] = sanitize_text_field( $attrs['startDate'] ) . ' 00:00:00';
	}
	if ( ! empty( $attrs['endDate'] ) ) {
		$query_args['end_date'] = sanitize_text_field( $attrs['endDate'] ) . ' 23:59:59';
	}
} else {
	$query_args['start_date'] = $now->format( 'Y-m-d H:i:s' );
}

if ( ! empty( $attrs['featuredOnly'] ) ) {
	$query_args['featured'] = true;
}

if ( ! empty( $attrs['venueIds'] ) && is_array( $attrs['venueIds'] ) ) {
	$query_args['venue'] = array_map( 'intval', $attrs['venueIds'] );
}

if ( ! empty( $attrs['categoryIds'] ) && is_array( $attrs['categoryIds'] ) ) {
	$query_args['tax_query'] = array(
		array(
			'taxonomy' => 'tribe_events_cat',
			'field'    => 'term_id',
			'terms'    => array_map( 'intval', $attrs['categoryIds'] ),
		),
	);
}

$query_args = (array) apply_filters( 'ucla_tec_block_query_args', $query_args, $attrs );
$events = tribe_get_events( $query_args );

if ( empty( $events ) ) {
	return '';
}

$wrapper_args = array(
	'class' => sprintf( 'ucla-tec ucla-tec--%s', sanitize_html_class( $layout ) ),
);
if ( $background_color ) {
	$wrapper_args['style'] = sprintf( 'background-color: %s;', $background_color );
}

$wrapper_attributes = get_block_wrapper_attributes( $wrapper_args );

ob_start();
?>
<section <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php if ( ! empty( $attrs['showHeading'] ) && ( ! empty( $attrs['eyebrow'] ) || ! empty( $attrs['heading'] ) ) ) : ?>
		<header class="ucla-tec__head">
			<div>
				<?php if ( ! empty( $attrs['eyebrow'] ) ) : ?>
					<p class="ucla-tec__eyebrow"><?php echo esc_html( $attrs['eyebrow'] ); ?></p>
				<?php endif; ?>
				<?php if ( ! empty( $attrs['heading'] ) ) : ?>
					<h2 class="ucla-tec__title"><?php echo esc_html( $attrs['heading'] ); ?></h2>
				<?php endif; ?>
			</div>
			<?php if ( ! empty( $attrs['viewAllUrl'] ) && ! empty( $attrs['viewAllLabel'] ) ) : ?>
				<a class="ucla-tec__view-all" href="<?php echo esc_url( $attrs['viewAllUrl'] ); ?>">
					<?php echo esc_html( $attrs['viewAllLabel'] ); ?>
					<span aria-hidden="true">&rarr;</span>
				</a>
			<?php endif; ?>
		</header>
	<?php endif; ?>

	<ol class="ucla-tec__list">
		<?php foreach ( $events as $event ) : ?>
			<?php
			$event_id = (int) $event->ID;
			$start_raw = (string) tribe_get_start_date( $event_id, true, 'Y-m-d H:i:s' );
			$start_ts = $start_raw ? strtotime( $start_raw ) : 0;
			$category_names = wp_get_post_terms( $event_id, 'tribe_events_cat', array( 'fields' => 'names' ) );
			$kind = is_array( $category_names ) && ! empty( $category_names ) ? (string) $category_names[0] : '';
			$time = $start_ts ? (string) tribe_get_start_date( $event_id, false, get_option( 'time_format' ) ) : '';
			$venue = (string) tribe_get_venue( $event_id );
			$meta_parts = array_filter( array( $kind, $time, $venue ) );
			?>
			<li class="ucla-tec__item">
				<a class="ucla-tec__row" href="<?php echo esc_url( tribe_get_event_link( $event ) ); ?>">
					<?php if ( ! empty( $attrs['showDateBlock'] ) ) : ?>
						<div class="ucla-tec__date" aria-hidden="true">
							<span class="ucla-tec__month"><?php echo esc_html( $start_ts ? strtoupper( date_i18n( 'M', $start_ts ) ) : '' ); ?></span>
							<span class="ucla-tec__day"><?php echo esc_html( $start_ts ? date_i18n( 'd', $start_ts ) : '' ); ?></span>
						</div>
					<?php endif; ?>
					<div class="ucla-tec__body">
						<h3 class="ucla-tec__event-title"><?php echo esc_html( get_the_title( $event_id ) ); ?></h3>
						<?php if ( ! empty( $attrs['showMeta'] ) && ! empty( $meta_parts ) ) : ?>
							<p class="ucla-tec__meta">
								<?php
								echo wp_kses_post(
									implode(
										'<span class="ucla-tec__sep" aria-hidden="true">·</span>',
										array_map( 'esc_html', $meta_parts )
									)
								);
								?>
							</p>
						<?php endif; ?>
					</div>
					<span class="ucla-tec__cta">
						<?php esc_html_e( 'Details', 'ucla-wordpress-plugin-ext' ); ?>
						<span aria-hidden="true">&rarr;</span>
					</span>
				</a>
			</li>
		<?php endforeach; ?>
	</ol>
</section>
<?php

return (string) ob_get_clean();
