( function ( blocks, blockEditor, components, element, data ) {
	var el = element.createElement;
	var useState = element.useState;
	var useMemo = element.useMemo;
	var useSelect = data.useSelect;
	var InspectorControls = blockEditor.InspectorControls;
	var useBlockProps = blockEditor.useBlockProps;
	var PanelBody = components.PanelBody;
	var ToggleControl = components.ToggleControl;
	var SelectControl = components.SelectControl;
	var TextControl = components.TextControl;
	var Spinner = components.Spinner;
	var __ = window.wp.i18n.__;

	function formatDate( dateString ) {
		if ( ! dateString ) {
			return '';
		}
		var date = new Date( dateString );
		if ( Number.isNaN( date.getTime() ) ) {
			return '';
		}
		return date.toLocaleDateString( 'en-US', { year: 'numeric', month: 'long', day: 'numeric' } );
	}

	function decodeHtml( text ) {
		var textarea = document.createElement( 'textarea' );
		textarea.innerHTML = text || '';
		return textarea.value;
	}

	function formatImageSizeLabel( imageSize ) {
		var label = imageSize && imageSize.name ? imageSize.name : imageSize.slug;
		var width = 0;
		var height = 0;

		if ( imageSize ) {
			width = parseInt(
				imageSize.width ||
					imageSize?.size?.width ||
					imageSize?.dimensions?.width ||
					0,
				10
			);
			height = parseInt(
				imageSize.height ||
					imageSize?.size?.height ||
					imageSize?.dimensions?.height ||
					0,
				10
			);
		}
		if ( width > 0 && height > 0 ) {
			return label + ' (' + width + 'x' + height + ')';
		}
		return label;
	}

	function getFeaturedImageUrl( post, mediaSize, customMediaSize ) {
		if ( ! post ) {
			return '';
		}
		var selectedSize = customMediaSize || mediaSize || 'full';
		var imageBySize = post.featured_media_src_urls || {};
		return imageBySize[ selectedSize ] || post.featured_media_src_url || '';
	}

	blocks.registerBlockType( 'ucla/featured-card-block', {
		edit: function ( props ) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;
			var blockProps = useBlockProps();
			var isInserterPreview = attributes.isInserterPreview === true;
			var showOverlay = attributes.showOverlay !== false;
			var searchTermState = useState( '' );
			var searchTerm = searchTermState[ 0 ];
			var setSearchTerm = searchTermState[ 1 ];

			if ( isInserterPreview ) {
				return el(
					'div',
					blockProps,
					el( 'div', {
						className: 'ucla-featured-card-inserter-preview-image',
						'aria-hidden': 'true',
					} )
				);
			}

			var postTypes = useSelect( function ( select ) {
				return select( 'core' ).getPostTypes( { per_page: -1 } );
			}, [] );

			var categories = useSelect( function ( select ) {
				return select( 'core' ).getEntityRecords( 'taxonomy', 'category', { per_page: -1 } );
			}, [] );

			var availableImageSizes = useSelect( function ( select ) {
				var settings = select( 'core/block-editor' ).getSettings();
				if ( ! settings || ! Array.isArray( settings.imageSizes ) ) {
					return [];
				}
				return settings.imageSizes;
			}, [] );

			var queryParams = useMemo(
				function () {
					var query = {
						per_page: 50,
						status: 'publish',
						orderby: 'date',
						order: 'desc',
					};
					if ( searchTerm ) {
						query.search = searchTerm;
					}
					if ( attributes.selectedCategoryId ) {
						query.categories = [ attributes.selectedCategoryId ];
					}
					return query;
				},
				[ searchTerm, attributes.selectedCategoryId ]
			);

			var posts = useSelect(
				function ( select ) {
					return select( 'core' ).getEntityRecords( 'postType', attributes.postType, queryParams );
				},
				[ attributes.postType, queryParams ]
			);

			var isLoadingPosts = useSelect(
				function ( select ) {
					return select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
						'postType',
						attributes.postType,
						queryParams,
					] );
				},
				[ attributes.postType, queryParams ]
			);

			var post = useSelect(
				function ( select ) {
					if ( attributes.selectedPostId ) {
						return select( 'core' ).getEntityRecord(
							'postType',
							attributes.postType,
							attributes.selectedPostId
						);
					}
					var recentPosts = select( 'core' ).getEntityRecords( 'postType', attributes.postType, {
						per_page: 1,
						status: 'publish',
						categories: attributes.selectedCategoryId
							? [ attributes.selectedCategoryId ]
							: undefined,
					} );
					return recentPosts ? recentPosts[ 0 ] : null;
				},
				[ attributes.selectedPostId, attributes.postType, attributes.selectedCategoryId ]
			);

			var categoryOptions = [ { label: __( '-- All Categories --', 'ucla-wordpress-plugin-ext' ), value: 0 } ];
			if ( categories && categories.length ) {
				categoryOptions = categoryOptions.concat(
					categories.map( function ( category ) {
						return { label: category.name, value: category.id };
					} )
				);
			}

			var postOptions = [
				{
					label: __( '-- Latest Published Post --', 'ucla-wordpress-plugin-ext' ),
					value: 0,
				},
			];
			if ( posts && posts.length ) {
				postOptions = postOptions.concat(
					posts.map( function ( currentPost ) {
						return {
							label: decodeHtml( currentPost.title && currentPost.title.rendered ),
							value: currentPost.id,
						};
					} )
				);
			}

			var imageSizeOptions = ( availableImageSizes && availableImageSizes.length
				? availableImageSizes
				: [
						{ slug: 'thumbnail', name: __( 'Thumbnail', 'ucla-wordpress-plugin-ext' ) },
						{ slug: 'medium', name: __( 'Medium', 'ucla-wordpress-plugin-ext' ) },
						{ slug: 'large', name: __( 'Large', 'ucla-wordpress-plugin-ext' ) },
				  ]
			).map( function ( imageSize ) {
				var normalized = Object.assign( {}, imageSize );
				if ( normalized && normalized.slug ) {
					if ( 'thumbnail' === normalized.slug ) {
						normalized.width = normalized.width || 150;
						normalized.height = normalized.height || 150;
					} else if ( 'medium' === normalized.slug ) {
						normalized.width = normalized.width || 300;
						normalized.height = normalized.height || 300;
					} else if ( 'large' === normalized.slug ) {
						normalized.width = normalized.width || 1024;
						normalized.height = normalized.height || 1024;
					}
				}
				return {
					label: formatImageSizeLabel( normalized ),
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
						{ title: __( 'Settings', 'ucla-wordpress-plugin-ext' ), initialOpen: true },
						el( SelectControl, {
							label: __( 'Content Type', 'ucla-wordpress-plugin-ext' ),
							value: attributes.postType,
							options: postTypes
								? postTypes.map( function ( type ) {
										return { label: type.name, value: type.slug };
									} )
								: [],
							onChange: function ( value ) {
								setAttributes( {
									postType: value,
									selectedPostId: null,
									selectedCategoryId: null,
								} );
								setSearchTerm( '' );
							},
						} ),
						el( SelectControl, {
							label: __( 'Filter by Category', 'ucla-wordpress-plugin-ext' ),
							value: attributes.selectedCategoryId || 0,
							options: categoryOptions,
							onChange: function ( value ) {
								setAttributes( {
									selectedCategoryId: parseInt( value, 10 ) || null,
									selectedPostId: null,
								} );
							},
						} ),
						el( TextControl, {
							label: __( 'Search Posts', 'ucla-wordpress-plugin-ext' ),
							value: searchTerm,
							onChange: setSearchTerm,
							placeholder: __( 'Enter search term', 'ucla-wordpress-plugin-ext' ),
						} ),
						isLoadingPosts ? el( Spinner ) : null,
						el( SelectControl, {
							label: __( 'Select Post', 'ucla-wordpress-plugin-ext' ),
							value: attributes.selectedPostId || 0,
							options: postOptions,
							onChange: function ( value ) {
								setAttributes( { selectedPostId: parseInt( value, 10 ) || null } );
							},
						} ),
						el( SelectControl, {
							label: __( 'Image Size', 'ucla-wordpress-plugin-ext' ),
							value: attributes.mediaSize,
							options: imageSizeOptions,
							onChange: function ( value ) {
								setAttributes( { mediaSize: value } );
							},
						} ),
						el( TextControl, {
							label: __( 'Custom Image Size Slug', 'ucla-wordpress-plugin-ext' ),
							help: __(
								'Optional. Use a registered image size slug to override the dropdown choice.',
								'ucla-wordpress-plugin-ext'
							),
							value: attributes.customMediaSize || '',
							onChange: function ( value ) {
								setAttributes( { customMediaSize: value } );
							},
							placeholder: __( 'e.g. card_thumb', 'ucla-wordpress-plugin-ext' ),
						} ),
						el( ToggleControl, {
							label: __( 'Overlay content box', 'ucla-wordpress-plugin-ext' ),
							checked: showOverlay,
							onChange: function ( value ) {
								setAttributes( { showOverlay: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Date', 'ucla-wordpress-plugin-ext' ),
							checked: !! attributes.showDate,
							onChange: function ( value ) {
								setAttributes( { showDate: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Title', 'ucla-wordpress-plugin-ext' ),
							checked: !! attributes.showTitle,
							onChange: function ( value ) {
								setAttributes( { showTitle: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Author', 'ucla-wordpress-plugin-ext' ),
							checked: !! attributes.showAuthor,
							onChange: function ( value ) {
								setAttributes( { showAuthor: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Excerpt', 'ucla-wordpress-plugin-ext' ),
							checked: !! attributes.showExcerpt,
							onChange: function ( value ) {
								setAttributes( { showExcerpt: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show Source', 'ucla-wordpress-plugin-ext' ),
							checked: !! attributes.showSource,
							onChange: function ( value ) {
								setAttributes( { showSource: value } );
							},
						} )
					)
				),
				post
					? el(
							'article',
							{
								className:
									'ucla-card ucla-card__story-featured ucla-featured-card-preview' +
									( showOverlay ? '' : ' ucla-featured-card--no-overlay' ),
							},
							el(
								'div',
								{ className: 'ucla-card__story-featured-body' },
								attributes.showDate
									? el(
											'p',
											{ className: 'ucla-card__date' },
											formatDate( post.date )
										)
									: null,
								attributes.showTitle
									? el(
											'h3',
											{ className: 'ucla-card__story-featured-title' },
											decodeHtml( post.title && post.title.rendered )
										)
									: null,
								attributes.showAuthor
									? el(
											'p',
											{ className: 'ucla-card__story-author' },
											__( 'By ', 'ucla-wordpress-plugin-ext' ) +
												( post.author_name || __( 'Unknown Author', 'ucla-wordpress-plugin-ext' ) )
										)
									: null,
								attributes.showExcerpt
									? el( 'p', {
											className: 'ucla-card__story-featured-summary',
											dangerouslySetInnerHTML: {
												__html: post.excerpt && post.excerpt.rendered ? post.excerpt.rendered : '',
											},
										} )
									: null,
								attributes.showSource
									? el(
											'p',
											{ className: 'ucla-card__story-featured-source' },
											__( 'Source: ', 'ucla-wordpress-plugin-ext' ) +
												( post.source_name || 'UCLA' )
										)
									: null
							),
							getFeaturedImageUrl( post, attributes.mediaSize, attributes.customMediaSize )
								? el( 'img', {
										className: 'ucla-card__story-featured-image',
										src: getFeaturedImageUrl(
											post,
											attributes.mediaSize,
											attributes.customMediaSize
										),
										alt: decodeHtml( post.title && post.title.rendered ),
									} )
								: null
						)
					: el(
							'div',
							{ className: 'ucla-featured-card-loading' },
							el( Spinner ),
							el( 'p', null, __( 'Loading post...', 'ucla-wordpress-plugin-ext' ) )
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
	window.wp.data
);
