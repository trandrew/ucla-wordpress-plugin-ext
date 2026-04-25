<?php
/**
 * Plugin Name: UCLA Design System Components - Extension
 * Description: Extends the UCLA WordPress Plugin blocks.
 * Version: 1.0.0
 * Author: UCLA Life Sciences Computing
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UCLA_PLUGIN_EXT_REQUIRED_PLUGIN', 'ucla-wordpress-plugin/index.php' );

/**
 * Check whether the required base plugin is active.
 *
 * @return bool
 */
function ucla_plugin_ext_is_required_plugin_active() {
	include_once ABSPATH . 'wp-admin/includes/plugin.php';

	return is_plugin_active( UCLA_PLUGIN_EXT_REQUIRED_PLUGIN );
}

/**
 * Show an admin notice when the dependency is missing.
 *
 * @return void
 */
function ucla_plugin_ext_missing_dependency_notice() {
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}
	?>
	<div class="notice notice-error">
		<p>
			<?php
			echo esc_html__(
				'UCLA WordPress Plugin Extension requires UCLA WordPress Plugin to be installed and activated.',
				'ucla-wordpress-plugin-ext'
			);
			?>
		</p>
	</div>
	<?php
}

/**
 * Prevent activation when dependency is not active.
 *
 * @return void
 */
function ucla_plugin_ext_on_activation() {
	if ( ucla_plugin_ext_is_required_plugin_active() ) {
		return;
	}

	deactivate_plugins( plugin_basename( __FILE__ ) );

	wp_die(
		esc_html__(
			'UCLA WordPress Plugin Extension could not be activated because UCLA WordPress Plugin is not active.',
			'ucla-wordpress-plugin-ext'
		),
		esc_html__( 'Plugin dependency missing', 'ucla-wordpress-plugin-ext' ),
		array( 'back_link' => true )
	);
}
register_activation_hook( __FILE__, 'ucla_plugin_ext_on_activation' );

if ( ! ucla_plugin_ext_is_required_plugin_active() ) {
	add_action( 'admin_notices', 'ucla_plugin_ext_missing_dependency_notice' );
	return;
}

/**
 * Check whether The Events Calendar plugin is active.
 *
 * @return bool
 */
function ucla_plugin_ext_is_tec_active() {
	return function_exists( 'tribe_get_events' );
}

/**
 * Show an admin notice when The Events Calendar is missing.
 *
 * @return void
 */
function ucla_plugin_ext_missing_tec_notice() {
	if ( ucla_plugin_ext_is_tec_active() ) {
		return;
	}

	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}
	?>
	<div class="notice notice-warning">
		<p>
			<?php
			echo esc_html__(
				'UCLA Events List block requires The Events Calendar plugin to be installed and activated.',
				'ucla-wordpress-plugin-ext'
			);
			?>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'ucla_plugin_ext_missing_tec_notice' );

/**
 * Register extension block category.
 *
 * @param array $categories Existing block categories.
 * @return array
 */
function ucla_plugin_ext_register_block_category( $categories ) {
	$slug = 'ucla-design-system-components-extended';
	$parent_slug = 'ucla-design-system-components';
	$existing_slugs = wp_list_pluck( $categories, 'slug' );

	if ( in_array( $slug, $existing_slugs, true ) ) {
		return $categories;
	}

	$new_category = array(
		'slug'  => $slug,
		'title' => __( 'UCLA Design System Components - Extended', 'ucla-wordpress-plugin-ext' ),
		'icon'  => null,
	);

	$parent_index = array_search( $parent_slug, $existing_slugs, true );
	if ( false === $parent_index ) {
		$categories[] = $new_category;
		return $categories;
	}

	array_splice( $categories, $parent_index + 1, 0, array( $new_category ) );

	return $categories;
}

if ( version_compare( get_bloginfo( 'version' ), '5.8', '>=' ) ) {
	add_filter( 'block_categories_all', 'ucla_plugin_ext_register_block_category', 20 );
} else {
	add_filter( 'block_categories', 'ucla_plugin_ext_register_block_category', 20 );
}

/**
 * Register featured image fields on post REST responses.
 *
 * @return void
 */
function ucla_plugin_ext_register_featured_image_rest_fields() {
	register_rest_field(
		'post',
		'featured_media_src_url',
		array(
			'get_callback' => function ( $post ) {
				$image_id = get_post_thumbnail_id( $post['id'] );
				$image = wp_get_attachment_image_src( $image_id, 'full' );
				return ! empty( $image[0] ) ? $image[0] : '';
			},
			'schema'       => null,
		)
	);

	register_rest_field(
		'post',
		'featured_media_src_urls',
		array(
			'get_callback' => function ( $post ) {
				$image_id = get_post_thumbnail_id( $post['id'] );
				if ( ! $image_id ) {
					return array();
				}

				$sizes = array_merge( get_intermediate_image_sizes(), array( 'full' ) );
				$urls  = array();

				foreach ( $sizes as $size ) {
					$image = wp_get_attachment_image_src( $image_id, $size );
					if ( ! empty( $image[0] ) ) {
						$urls[ $size ] = $image[0];
					}
				}

				return $urls;
			},
			'schema'       => null,
		)
	);
}
add_action( 'rest_api_init', 'ucla_plugin_ext_register_featured_image_rest_fields' );

/**
 * Disable responsive-controls overrides for core/image.
 *
 * The parent UCLA plugin responsive-controls layer rewrites style attributes
 * and can interfere with native Image block aspect-ratio/crop behavior.
 * We append core/image to the unsupported list from this extension plugin
 * so the fix survives parent plugin updates.
 *
 * @param array $unsupported_blocks Unsupported block names.
 * @return array
 */
function ucla_plugin_ext_disable_responsive_controls_for_core_image( $unsupported_blocks ) {
	if ( ! is_array( $unsupported_blocks ) ) {
		$unsupported_blocks = array();
	}

	if ( ! in_array( 'core/image', $unsupported_blocks, true ) ) {
		$unsupported_blocks[] = 'core/image';
	}

	return $unsupported_blocks;
}
add_filter( 'ucla_unsupported_unresponsive_blocks', 'ucla_plugin_ext_disable_responsive_controls_for_core_image' );

/**
 * Remove responsiveControls from core/image blocks before render.
 *
 * The parent UCLA plugin's render_block hook mutates core/image output when
 * responsiveControls is present, which can override the selected image size
 * (for example rendering as full size instead of square). Unsetting the
 * attribute here keeps native Image block size/crop behavior intact.
 *
 * @param array $parsed_block Parsed block data.
 * @return array
 */
function ucla_plugin_ext_strip_core_image_responsive_controls( $parsed_block ) {
	if ( ! is_array( $parsed_block ) ) {
		return $parsed_block;
	}

	if ( ( $parsed_block['blockName'] ?? '' ) !== 'core/image' ) {
		return $parsed_block;
	}

	if ( isset( $parsed_block['attrs']['responsiveControls'] ) ) {
		unset( $parsed_block['attrs']['responsiveControls'] );
	}

	return $parsed_block;
}
add_filter( 'render_block_data', 'ucla_plugin_ext_strip_core_image_responsive_controls', 10, 1 );

/**
 * Register blocks from modular block folders.
 *
 * Every block should live at: /blocks/<block-name>/block.json
 *
 * @return void
 */
function ucla_plugin_ext_render_featured_card_block( $attributes, $content, $block ) {
	$template_file = plugin_dir_path( __FILE__ ) . 'blocks/featured-card/render.php';
	if ( ! file_exists( $template_file ) ) {
		return '';
	}

	return require $template_file;
}

function ucla_plugin_ext_render_hero_banner_block( $attributes, $content, $block ) {
	$template_file = plugin_dir_path( __FILE__ ) . 'blocks/hero-banner/render.php';
	if ( ! file_exists( $template_file ) ) {
		return '';
	}

	return require $template_file;
}

function ucla_plugin_ext_render_dynamic_story_cards_block( $attributes, $content, $block ) {
	$template_file = plugin_dir_path( __FILE__ ) . 'blocks/dynamic-story-cards/render.php';
	if ( ! file_exists( $template_file ) ) {
		return '';
	}

	return require $template_file;
}

function ucla_plugin_ext_render_tec_events_block( $attributes, $content, $block ) {
	$template_file = plugin_dir_path( __FILE__ ) . 'blocks/tec-events/render.php';
	if ( ! file_exists( $template_file ) ) {
		return '';
	}

	return require $template_file;
}

function ucla_plugin_ext_register_blocks() {
	$block_metadata_files = glob( plugin_dir_path( __FILE__ ) . 'blocks/*/block.json' );

	if ( ! is_array( $block_metadata_files ) ) {
		return;
	}

	foreach ( $block_metadata_files as $block_metadata_file ) {
		$block_dir = dirname( $block_metadata_file );
		$block_slug = basename( $block_dir );

		if ( 'featured-card' === $block_slug ) {
			register_block_type(
				$block_dir,
				array(
					'render_callback' => 'ucla_plugin_ext_render_featured_card_block',
				)
			);
			continue;
		}

		if ( 'dynamic-story-cards' === $block_slug ) {
			register_block_type(
				$block_dir,
				array(
					'render_callback' => 'ucla_plugin_ext_render_dynamic_story_cards_block',
				)
			);
			continue;
		}

		if ( 'hero-banner' === $block_slug ) {
			register_block_type(
				$block_dir,
				array(
					'render_callback' => 'ucla_plugin_ext_render_hero_banner_block',
				)
			);
			continue;
		}

		if ( 'tec-events' === $block_slug ) {
			if ( ! ucla_plugin_ext_is_tec_active() ) {
				continue;
			}

			register_block_type(
				$block_dir,
				array(
					'render_callback' => 'ucla_plugin_ext_render_tec_events_block',
				)
			);
			continue;
		}

		register_block_type( $block_dir );
	}
}
add_action( 'init', 'ucla_plugin_ext_register_blocks' );
