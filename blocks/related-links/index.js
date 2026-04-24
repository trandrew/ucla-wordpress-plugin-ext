( function ( blocks, i18n, blockEditor, components, element ) {
	var el = element.createElement;
	var __ = i18n.__;
	var InspectorControls = blockEditor.InspectorControls;
	var PanelBody = components.PanelBody;
	var TextControl = components.TextControl;
	var ToggleControl = components.ToggleControl;
	var SelectControl = components.SelectControl;
	var Button = components.Button;
	var useBlockProps = blockEditor.useBlockProps;
	var useState = element.useState;
	var useEffect = element.useEffect;
	var useRef = element.useRef;

	function trailingIcon() {
		return el(
			'svg',
			{
				width: '18',
				height: '18',
				viewBox: '0 0 18 18',
				fill: 'none',
				xmlns: 'http://www.w3.org/2000/svg',
				'aria-hidden': 'true',
				focusable: 'false',
			},
			el( 'path', {
				d: 'M16 16L2 16L2 2L9 2V0L2 0C0.89 0 0 0.9 0 2L0 16C0 17.1 0.89 18 2 18L16 18C17.1 18 18 17.1 18 16L18 9L16 9V16ZM11 0V2L14.59 2L4.76 11.83L6.17 13.24L16 3.41L16 7H18V0L11 0Z',
			} )
		);
	}

	blocks.registerBlockType( 'ucla-wordpress-plugin-ext/related-links', {
		edit: function ( props ) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;
			var blockProps = useBlockProps();
			var isInserterPreview = attributes.isInserterPreview === true;
			var links = Array.isArray( attributes.links ) ? attributes.links : [];
			var showIcon = attributes.showIcon !== false;
			var layout = attributes.layout === 'vertical' ? 'vertical' : 'horizontal';

			if ( isInserterPreview ) {
				return el(
					'div',
					blockProps,
					el( 'div', {
						className: 'ucla-related-links-inserter-preview-image',
						'aria-hidden': 'true',
					} )
				);
			}

			var _useState = useState( links ),
				draftLinks = _useState[ 0 ],
				setDraftLinks = _useState[ 1 ];
			var commitTimerRef = useRef( null );
			var linksMatchDraftRef = useRef( true );

			useEffect( function () {
				if ( linksMatchDraftRef.current ) {
					setDraftLinks( links );
				}
			}, [ links ] );

			useEffect( function () {
				return function () {
					if ( commitTimerRef.current ) {
						clearTimeout( commitTimerRef.current );
					}
				};
			}, [] );

			function commitLinks( nextLinks ) {
				if ( commitTimerRef.current ) {
					clearTimeout( commitTimerRef.current );
				}
				linksMatchDraftRef.current = true;
				setAttributes( { links: nextLinks } );
			}

			function scheduleCommit( nextLinks ) {
				if ( commitTimerRef.current ) {
					clearTimeout( commitTimerRef.current );
				}
				linksMatchDraftRef.current = false;
				commitTimerRef.current = setTimeout( function () {
					commitLinks( nextLinks );
				}, 250 );
			}

			function updateLink( index, field, value ) {
				var nextLinks = draftLinks.slice();
				nextLinks[ index ] = Object.assign( {}, nextLinks[ index ], ( function () {
					var payload = {};
					payload[ field ] = value;
					return payload;
				} )() );
				setDraftLinks( nextLinks );
				scheduleCommit( nextLinks );
			}

			function addLink() {
				var nextLinks = draftLinks.slice();
				nextLinks.push( {
					text: __( 'Related Link', 'ucla-wordpress-plugin-ext' ),
					url: '',
					newTab: false,
				} );
				setDraftLinks( nextLinks );
				commitLinks( nextLinks );
			}

			function removeLink( index ) {
				var nextLinks = draftLinks.filter( function ( _link, i ) {
					return i !== index;
				} );
				nextLinks = nextLinks.length ? nextLinks : [ { text: '', url: '', newTab: false } ];
				setDraftLinks( nextLinks );
				commitLinks( nextLinks );
			}

			function moveLink( index, direction ) {
				var toIndex = index + direction;
				if ( toIndex < 0 || toIndex >= draftLinks.length ) {
					return;
				}
				var nextLinks = draftLinks.slice();
				var movedLink = nextLinks[ index ];
				nextLinks[ index ] = nextLinks[ toIndex ];
				nextLinks[ toIndex ] = movedLink;
				setDraftLinks( nextLinks );
				commitLinks( nextLinks );
			}

			var inspector = el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{
						title: __( 'Related Links Settings', 'ucla-wordpress-plugin-ext' ),
						initialOpen: true,
					},
					el( ToggleControl, {
						label: __( 'Show trailing icon', 'ucla-wordpress-plugin-ext' ),
						checked: showIcon,
						onChange: function ( value ) {
							setAttributes( { showIcon: !! value } );
						},
					} ),
					el( SelectControl, {
						label: __( 'Layout', 'ucla-wordpress-plugin-ext' ),
						value: layout,
						options: [
							{ label: __( 'Horizontal', 'ucla-wordpress-plugin-ext' ), value: 'horizontal' },
							{ label: __( 'Vertical', 'ucla-wordpress-plugin-ext' ), value: 'vertical' },
						],
						onChange: function ( value ) {
							setAttributes( { layout: value === 'vertical' ? 'vertical' : 'horizontal' } );
						},
					} )
				),
				el(
					PanelBody,
					{
						title: __( 'Links', 'ucla-wordpress-plugin-ext' ),
						initialOpen: true,
					},
					draftLinks.map( function ( link, index ) {
						return el(
							'div',
							{ key: 'related-link-control-' + index, className: 'ucla-related-links-control-item' },
							el( TextControl, {
								label: __( 'Link text', 'ucla-wordpress-plugin-ext' ) + ' #' + ( index + 1 ),
								value: link.text || '',
								onChange: function ( value ) {
									updateLink( index, 'text', value );
								},
								onBlur: function () {
									commitLinks( draftLinks );
								},
							} ),
							el( TextControl, {
								label: __( 'URL', 'ucla-wordpress-plugin-ext' ),
								value: link.url || '',
								onChange: function ( value ) {
									updateLink( index, 'url', value );
								},
								onBlur: function () {
									commitLinks( draftLinks );
								},
							} ),
							el( ToggleControl, {
								label: __( 'Open in new tab', 'ucla-wordpress-plugin-ext' ),
								checked: !! link.newTab,
								onChange: function ( value ) {
									updateLink( index, 'newTab', !! value );
								},
							} ),
							el(
								'div',
								{ className: 'ucla-related-links-reorder-buttons' },
								el(
									Button,
									{
										variant: 'secondary',
										disabled: index === 0,
										onClick: function () {
											moveLink( index, -1 );
										},
									},
									__( 'Move up', 'ucla-wordpress-plugin-ext' )
								),
								el(
									Button,
									{
										variant: 'secondary',
										disabled: index === draftLinks.length - 1,
										onClick: function () {
											moveLink( index, 1 );
										},
									},
									__( 'Move down', 'ucla-wordpress-plugin-ext' )
								)
							),
							el(
								Button,
								{
									isDestructive: true,
									onClick: function () {
										removeLink( index );
									},
								},
								__( 'Remove link', 'ucla-wordpress-plugin-ext' )
							)
						);
					} ),
					el(
						Button,
						{
							variant: 'secondary',
							onClick: addLink,
						},
						__( 'Add link', 'ucla-wordpress-plugin-ext' )
					)
				)
			);

			var preview = el(
				'div',
				{
					className:
						'ucla-related-links-preview' +
						( layout === 'vertical' ? ' is-layout-vertical' : ' is-layout-horizontal' ),
				},
				draftLinks.map( function ( link, index ) {
					var linkText = link.text || __( 'Related Link', 'ucla-wordpress-plugin-ext' );
					return el(
						'span',
						{
							key: 'related-link-preview-' + index,
							className: 'ucla-related-link',
						},
						linkText,
						showIcon ? trailingIcon() : null
					);
				} )
			);

			return el(
				'div',
				blockProps,
				inspector,
				preview
			);
		},

		save: function ( props ) {
			var links = Array.isArray( props.attributes.links ) ? props.attributes.links : [];
			var showIcon = props.attributes.showIcon !== false;
			var layout = props.attributes.layout === 'vertical' ? 'vertical' : 'horizontal';

			return el(
				'div',
				{
					className:
						'ucla-related-links-list' +
						( layout === 'vertical' ? ' is-layout-vertical' : ' is-layout-horizontal' ),
				},
				links.map( function ( link, index ) {
					var linkText = link.text || __( 'Related Link', 'ucla-wordpress-plugin-ext' );
					var linkUrl = link.url || '#';
					return el(
						'a',
						{
							key: 'related-link-save-' + index,
							className: 'ucla-related-link',
							href: linkUrl,
							target: link.newTab ? '_blank' : undefined,
							rel: link.newTab ? 'noopener noreferrer' : undefined,
						},
						linkText,
						showIcon ? trailingIcon() : null
					);
				} )
			);
		},
	} );
} )( window.wp.blocks, window.wp.i18n, window.wp.blockEditor, window.wp.components, window.wp.element );
