( function ( blocks, blockEditor, components, element, data, i18n ) {
	var el = element.createElement;
	var useSelect = data.useSelect;
	var useMemo = element.useMemo;
	var InspectorControls = blockEditor.InspectorControls;
	var useBlockProps = blockEditor.useBlockProps;
	var PanelBody = components.PanelBody;
	var ToggleControl = components.ToggleControl;
	var SelectControl = components.SelectControl;
	var TextControl = components.TextControl;
	var RangeControl = components.RangeControl;
	var Spinner = components.Spinner;
	var ColorPalette = components.ColorPalette;
	var __ = i18n.__;

	function decodeHtml( text ) {
		var textarea = document.createElement( 'textarea' );
		textarea.innerHTML = text || '';
		return textarea.value;
	}

	function normalizeToIntArray( value ) {
		if ( ! Array.isArray( value ) ) {
			return [];
		}
		return value
			.map( function ( id ) {
				return parseInt( id, 10 );
			} )
			.filter( function ( id ) {
				return id > 0;
			} );
	}

	function formatImageSizeLabel( imageSize ) {
		var label = imageSize && imageSize.name ? imageSize.name : imageSize.slug;
		var width = imageSize && imageSize.width ? parseInt( imageSize.width, 10 ) : 0;
		var height = imageSize && imageSize.height ? parseInt( imageSize.height, 10 ) : 0;
		return width > 0 && height > 0 ? label + ' (' + width + 'x' + height + ')' : label;
	}

	function toPositiveInt( value ) {
		var parsed = parseInt( value, 10 );
		return Number.isFinite( parsed ) && parsed > 0 ? parsed : 0;
	}

	function preventEditorNavigation( event ) {
		event.preventDefault();
		event.stopPropagation();
	}

	blocks.registerBlockType( 'ucla/card', {
		edit: function ( props ) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;
			var blockProps = useBlockProps();
			var selectedCategories = normalizeToIntArray( attributes.categories );
			var selectedTags = normalizeToIntArray( attributes.tags );

			var postTypes = useSelect( function ( select ) {
				return select( 'core' ).getPostTypes( { per_page: -1 } );
			}, [] );

			var categories = useSelect( function ( select ) {
				return select( 'core' ).getEntityRecords( 'taxonomy', 'category', { per_page: -1 } );
			}, [] );

			var tags = useSelect( function ( select ) {
				return select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag', { per_page: -1 } );
			}, [] );

			var availableImageSizes = useSelect( function ( select ) {
				var settings = select( 'core/block-editor' ).getSettings();
				return settings && Array.isArray( settings.imageSizes ) ? settings.imageSizes : [];
			}, [] );

			var postQuery = useMemo(
				function () {
					return {
						per_page: Math.min( attributes.postsToShow || 5, 20 ),
						offset: Math.min( attributes.offset || 0, 100 ),
						status: 'publish',
						_embed: true,
						categories: selectedCategories.length ? selectedCategories : undefined,
						tags: selectedTags.length ? selectedTags : undefined,
					};
				},
				[ attributes.postsToShow, attributes.offset, selectedCategories, selectedTags ]
			);

			var posts = useSelect(
				function ( select ) {
					var fetchedPosts = select( 'core' ).getEntityRecords(
						'postType',
						attributes.postType || 'post',
						postQuery
					);
					return Array.isArray( fetchedPosts ) ? fetchedPosts : [];
				},
				[ attributes.postType, postQuery ]
			);

			var isLoadingPosts = useSelect(
				function ( select ) {
					return select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
						'postType',
						attributes.postType || 'post',
						postQuery,
					] );
				},
				[ attributes.postType, postQuery ]
			);

			var postTypeOptions = postTypes
				? postTypes
						.filter( function ( type ) {
							return !! type.viewable;
						} )
						.map( function ( type ) {
							return { label: type.name, value: type.slug };
						} )
				: [];

			var categoryOptions = categories
				? categories.map( function ( category ) {
						return { label: category.name, value: category.id };
					} )
				: [];

			var tagOptions = tags
				? tags.map( function ( tag ) {
						return { label: tag.name, value: tag.id };
					} )
				: [];

			var imageSizeOptions = ( availableImageSizes.length
				? availableImageSizes
				: [
						{ slug: 'thumbnail', name: __( 'Thumbnail', 'ucla-wordpress-plugin-ext' ) },
						{ slug: 'medium', name: __( 'Medium', 'ucla-wordpress-plugin-ext' ) },
						{ slug: 'large', name: __( 'Large', 'ucla-wordpress-plugin-ext' ) },
				  ]
			).map( function ( imageSize ) {
				return {
					label: formatImageSizeLabel( imageSize ),
					value: imageSize.slug,
				};
			} );

			if ( ! imageSizeOptions.some( function ( option ) { return option.value === 'full'; } ) ) {
				imageSizeOptions.push( {
					label: __( 'Full (original)', 'ucla-wordpress-plugin-ext' ),
					value: 'full',
				} );
			}

			return el(
				'div',
				blockProps,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Story Card Settings', 'ucla-wordpress-plugin-ext' ), initialOpen: true },
						el( RangeControl, {
							label: __( 'Number of posts', 'ucla-wordpress-plugin-ext' ),
							value: attributes.postsToShow || 5,
							onChange: function ( value ) {
								setAttributes( { postsToShow: value || 5 } );
							},
							min: 1,
							max: 20,
						} ),
						el( SelectControl, {
							label: __( 'Post Type', 'ucla-wordpress-plugin-ext' ),
							value: attributes.postType || 'post',
							options: postTypeOptions,
							onChange: function ( value ) {
								setAttributes( { postType: value, categories: [], tags: [] } );
							},
						} ),
						el( SelectControl, {
							multiple: true,
							label: __( 'Filter by Category', 'ucla-wordpress-plugin-ext' ),
							value: selectedCategories.map( String ),
							options: categoryOptions.map( function ( option ) {
								return { label: option.label, value: String( option.value ) };
							} ),
							onChange: function ( values ) {
								var nextValues = Array.isArray( values ) ? values : [ values ];
								setAttributes( { categories: normalizeToIntArray( nextValues ) } );
							},
						} ),
						el( SelectControl, {
							multiple: true,
							label: __( 'Filter by Tag', 'ucla-wordpress-plugin-ext' ),
							value: selectedTags.map( String ),
							options: tagOptions.map( function ( option ) {
								return { label: option.label, value: String( option.value ) };
							} ),
							onChange: function ( values ) {
								var nextValues = Array.isArray( values ) ? values : [ values ];
								setAttributes( { tags: normalizeToIntArray( nextValues ) } );
							},
						} ),
						el( SelectControl, {
							label: __( 'Image Size', 'ucla-wordpress-plugin-ext' ),
							value: attributes.thumbnailSize || 'thumbnail',
							options: imageSizeOptions,
							onChange: function ( value ) {
								setAttributes( { thumbnailSize: value } );
							},
						} ),
						el( TextControl, {
							label: __( 'Thumbnail width (px)', 'ucla-wordpress-plugin-ext' ),
							value: attributes.thumbnailWidth ? String( attributes.thumbnailWidth ) : '',
							onChange: function ( value ) {
								setAttributes( { thumbnailWidth: toPositiveInt( value ) } );
							},
							help: __( 'Leave empty to use natural image width.', 'ucla-wordpress-plugin-ext' ),
							placeholder: '300',
						} ),
						el( TextControl, {
							label: __( 'Thumbnail height (px)', 'ucla-wordpress-plugin-ext' ),
							value: attributes.thumbnailHeight ? String( attributes.thumbnailHeight ) : '',
							onChange: function ( value ) {
								setAttributes( { thumbnailHeight: toPositiveInt( value ) } );
							},
							help: __( 'Leave empty to use natural image height.', 'ucla-wordpress-plugin-ext' ),
							placeholder: '220',
						} ),
						el( SelectControl, {
							label: __( 'Thumbnail fit mode', 'ucla-wordpress-plugin-ext' ),
							value: attributes.thumbnailFit || 'cover',
							options: [
								{ label: __( 'Cover', 'ucla-wordpress-plugin-ext' ), value: 'cover' },
								{ label: __( 'Contain', 'ucla-wordpress-plugin-ext' ), value: 'contain' },
								{ label: __( 'Crop', 'ucla-wordpress-plugin-ext' ), value: 'crop' },
							],
							onChange: function ( value ) {
								setAttributes( { thumbnailFit: value } );
							},
						} ),
						el( RangeControl, {
							label: __( 'Offset', 'ucla-wordpress-plugin-ext' ),
							value: attributes.offset || 0,
							onChange: function ( value ) {
								setAttributes( { offset: value || 0 } );
							},
							min: 0,
							max: 100,
						} ),
						el( TextControl, {
							label: __( 'Custom CSS Class', 'ucla-wordpress-plugin-ext' ),
							value: attributes.customClass || '',
							onChange: function ( value ) {
								setAttributes( { customClass: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Date', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.showDate !== false,
							onChange: function ( value ) {
								setAttributes( { showDate: !! value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Title', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.showTitle !== false,
							onChange: function ( value ) {
								setAttributes( { showTitle: !! value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Author', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.showAuthor !== false,
							onChange: function ( value ) {
								setAttributes( { showAuthor: !! value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Description', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.showDescription !== false,
							onChange: function ( value ) {
								setAttributes( { showDescription: !! value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Featured Image', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.showImage !== false,
							onChange: function ( value ) {
								setAttributes( { showImage: !! value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Enable card hover animations', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.enableAnimations !== false,
							onChange: function ( value ) {
								setAttributes( { enableAnimations: !! value } );
							},
						} ),
						el( 'p', null, __( 'Card background color', 'ucla-wordpress-plugin-ext' ) ),
						el( ColorPalette, {
							value: attributes.cardBackgroundColor || '',
							colors: [
								{ name: 'White', color: '#ffffff' },
								{ name: 'Light Gray', color: '#f7f7f7' },
								{ name: 'UCLA Blue', color: '#2774ae' },
								{ name: 'UCLA Gold', color: '#ffd100' },
							],
							onChange: function ( value ) {
								setAttributes( { cardBackgroundColor: value || '' } );
							},
							clearable: true,
						} )
					)
				),
				isLoadingPosts
					? el( 'div', { className: 'ucla-dynamic-story-cards-loading' }, el( Spinner ) )
					: el(
							'div',
							{ className: 'ucla-cards-container ucla-dynamic-story-cards-preview' },
							posts.length
								? posts.map( function ( post ) {
										var embedded = post._embedded || {};
										var media = embedded['wp:featuredmedia'] && embedded['wp:featuredmedia'][0];
										var sizes = media && media.media_details && media.media_details.sizes;
										var selectedThumbnailSize = attributes.thumbnailSize || 'thumbnail';
										var thumbnailFit = attributes.thumbnailFit || 'cover';
										var objectFit = thumbnailFit === 'contain' ? 'contain' : 'cover';
										var imageStyle = {
											objectFit: objectFit,
											objectPosition: 'center center',
											maxWidth: '100%',
										};
										if ( attributes.thumbnailWidth > 0 ) {
											imageStyle.width = attributes.thumbnailWidth + 'px';
										}
										if ( attributes.thumbnailHeight > 0 ) {
											imageStyle.height = attributes.thumbnailHeight + 'px';
										}
										var source =
											attributes.showImage !== false
												? ( sizes &&
														sizes[ selectedThumbnailSize ] &&
														sizes[ selectedThumbnailSize ].source_url ) ||
												  ( media && media.source_url ) ||
												  ''
												: '';
										var postAuthor =
											embedded.author && embedded.author[0] ? embedded.author[0].name : '';

										return el(
											'article',
											{
												key: post.id,
												className:
													'ucla-card ucla-card__story' +
													( attributes.enableAnimations !== false
														? ' ucla-card--animate'
														: '' ),
												style: attributes.cardBackgroundColor
													? { backgroundColor: attributes.cardBackgroundColor }
													: undefined,
											},
											source
												? el(
														'a',
														{
															href: post.link,
															className: 'story-card-image-link',
															onClick: preventEditorNavigation,
														},
														el( 'img', {
															className: 'ucla-card__image',
															src: source,
															alt: decodeHtml( post.title && post.title.rendered ),
															style: imageStyle,
														} )
												  )
												: null,
											el(
												'div',
												{ className: 'ucla-card__body' },
												attributes.showDate !== false
													? el(
															'p',
															{ className: 'ucla-card__date' },
															new Date( post.date ).toLocaleDateString( 'en-US', {
																year: 'numeric',
																month: 'long',
																day: 'numeric',
															} )
													  )
													: null,
												attributes.showTitle !== false
													? el(
															'h3',
															{ className: 'ucla-card__title' },
															el(
																'a',
																{
																	className: 'ucla-card__title-link',
																	href: post.link,
																	onClick: preventEditorNavigation,
																},
																decodeHtml( post.title && post.title.rendered )
															)
													  )
													: null,
												attributes.showAuthor !== false && postAuthor
													? el(
															'p',
															{ className: 'ucla-card__author' },
															__( 'By ', 'ucla-wordpress-plugin-ext' ) + postAuthor
													  )
													: null,
												attributes.showDescription !== false
													? el( 'p', {
															className: 'ucla-card__description',
															dangerouslySetInnerHTML: {
																__html:
																	post.excerpt && post.excerpt.rendered
																		? post.excerpt.rendered
																		: '',
															},
													  } )
													: null
											)
										);
								  } )
								: el(
										'p',
										{ className: 'ucla-dynamic-story-cards-empty' },
										__( 'No posts found.', 'ucla-wordpress-plugin-ext' )
								  )
						)
			);
		},
		save: function () {
			return null;
		},
	} );
} )(
	window.wp.blocks,
	window.wp.blockEditor,
	window.wp.components,
	window.wp.element,
	window.wp.data,
	window.wp.i18n
);
