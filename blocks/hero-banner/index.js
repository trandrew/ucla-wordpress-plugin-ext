( function ( blocks, blockEditor, components, element, i18n ) {
	var el = element.createElement;
	var __ = i18n.__;
	var useBlockProps = blockEditor.useBlockProps;
	var InspectorControls = blockEditor.InspectorControls;
	var MediaUpload = blockEditor.MediaUpload;
	var MediaUploadCheck = blockEditor.MediaUploadCheck;
	var PanelBody = components.PanelBody;
	var TextControl = components.TextControl;
	var TextareaControl = components.TextareaControl;
	var Button = components.Button;
	var ToggleControl = components.ToggleControl;

	blocks.registerBlockType( 'ucla/hero-banner-block', {
		edit: function ( props ) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;
			var blockProps = useBlockProps();

			function onSelectImage( media ) {
				setAttributes( {
					imageId: media && media.id ? media.id : 0,
					imageUrl: media && media.url ? media.url : '',
					imageAlt: media && media.alt ? media.alt : '',
				} );
			}

			function onRemoveImage() {
				setAttributes( {
					imageId: 0,
					imageUrl: '',
					imageAlt: '',
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
						{ title: __( 'Content', 'ucla-wordpress-plugin-ext' ), initialOpen: true },
						el( TextControl, {
							label: __( 'Headline', 'ucla-wordpress-plugin-ext' ),
							value: attributes.headline || '',
							onChange: function ( value ) {
								setAttributes( { headline: value } );
							},
						} ),
						el( TextareaControl, {
							label: __( 'Description', 'ucla-wordpress-plugin-ext' ),
							value: attributes.description || '',
							onChange: function ( value ) {
								setAttributes( { description: value } );
							},
						} ),
						el( TextControl, {
							label: __( 'Button Text', 'ucla-wordpress-plugin-ext' ),
							value: attributes.buttonText || '',
							onChange: function ( value ) {
								setAttributes( { buttonText: value } );
							},
						} ),
						el( TextControl, {
							label: __( 'Button URL', 'ucla-wordpress-plugin-ext' ),
							value: attributes.buttonUrl || '',
							onChange: function ( value ) {
								setAttributes( { buttonUrl: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Open button in new tab', 'ucla-wordpress-plugin-ext' ),
							checked: !! attributes.openInNewTab,
							onChange: function ( value ) {
								setAttributes( { openInNewTab: !! value } );
							},
						} )
					),
					el(
						PanelBody,
						{ title: __( 'Background Image', 'ucla-wordpress-plugin-ext' ), initialOpen: true },
						el(
							MediaUploadCheck,
							null,
							el( MediaUpload, {
								onSelect: onSelectImage,
								allowedTypes: [ 'image' ],
								value: attributes.imageId,
								render: function ( mediaUploadProps ) {
									return el(
										Button,
										{
											variant: 'secondary',
											onClick: mediaUploadProps.open,
										},
										attributes.imageUrl
											? __( 'Replace Image', 'ucla-wordpress-plugin-ext' )
											: __( 'Select Image', 'ucla-wordpress-plugin-ext' )
									);
								},
							} )
						),
						attributes.imageUrl
							? el(
									Button,
									{
										variant: 'link',
										isDestructive: true,
										onClick: onRemoveImage,
									},
									__( 'Remove Image', 'ucla-wordpress-plugin-ext' )
							  )
							: null
					)
				),
				el(
					'section',
					{ className: 'ucla-hero-banner' },
					el(
						'div',
						{ className: 'ucla-hero-banner__inner' },
						el(
							'div',
							{ className: 'ucla-hero-banner__media', 'aria-hidden': 'true' },
							attributes.imageUrl
								? el( 'img', {
										src: attributes.imageUrl,
										alt: '',
										className: 'ucla-hero-banner__image',
								  } )
								: el( 'div', { className: 'ucla-hero-banner__placeholder' } )
						),
						el(
							'div',
							{ className: 'ucla-hero-banner__content' },
							el(
								'h2',
								{ className: 'ucla-hero-banner__headline' },
								attributes.headline || __( 'Hero headline', 'ucla-wordpress-plugin-ext' )
							),
							el(
								'p',
								{ className: 'ucla-hero-banner__description' },
								attributes.description || ''
							),
							attributes.buttonText
								? el(
										'span',
										{ className: 'ucla-hero-banner__button' },
										attributes.buttonText
								  )
								: null
						)
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
	window.wp.i18n
);
