( function ( wp ) {
	const { registerBlockType } = wp.blocks;
	const { __ } = wp.i18n;
	const { useBlockProps, InspectorControls } = wp.blockEditor;
	const {
		PanelBody,
		TextControl,
		RangeControl,
		SelectControl,
		ToggleControl,
		FormTokenField,
		Placeholder,
		Spinner,
		ColorPalette,
	} = wp.components;
	const ServerSideRender = wp.serverSideRender;
	const { createElement: el, Fragment, useState, useEffect } = wp.element;
	const apiFetch = wp.apiFetch;

	function useTerms( taxonomy ) {
		const [ terms, setTerms ] = useState( [] );

		useEffect( () => {
			apiFetch( { path: `/wp/v2/${ taxonomy }?per_page=100&_fields=id,name,slug` } )
				.then( ( data ) => setTerms( Array.isArray( data ) ? data : [] ) )
				.catch( () => setTerms( [] ) );
		}, [ taxonomy ] );

		return terms;
	}

	function useVenues() {
		const [ venues, setVenues ] = useState( [] );

		useEffect( () => {
			apiFetch( { path: '/wp/v2/tribe_venue?per_page=100&_fields=id,title' } )
				.then( ( data ) => setVenues( Array.isArray( data ) ? data : [] ) )
				.catch( () => setVenues( [] ) );
		}, [] );

		return venues;
	}

	registerBlockType( 'ucla/tec-events', {
		edit: ( props ) => {
			const { attributes, setAttributes } = props;
			const blockProps = useBlockProps();
			const blockWrapperStyle = {
				...( blockProps.style || {} ),
				margin: 0,
				padding: 0,
			};
			const previewAttributes = { ...attributes };
			delete previewAttributes.layout;
			delete previewAttributes.responsiveControls;
			const categories = useTerms( 'tribe_events_cat' );
			const venues = useVenues();

			const catSuggestions = categories.map( ( term ) => term.name );
			const venueSuggestions = venues.map( ( venue ) => venue.title?.rendered || venue.title || '' );

			const selectedCatNames = attributes.categoryIds
				.map( ( id ) => categories.find( ( term ) => term.id === id )?.name )
				.filter( Boolean );

			const selectedVenueNames = attributes.venueIds
				.map( ( id ) => {
					const venue = venues.find( ( item ) => item.id === id );
					return venue ? venue.title?.rendered || venue.title : null;
				} )
				.filter( Boolean );
			const stopPreviewNavigation = ( event ) => {
				if ( event.target?.closest && event.target.closest( 'a' ) ) {
					event.preventDefault();
					event.stopPropagation();
				}
			};

			return el(
				Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Heading', 'ucla-wordpress-plugin-ext' ), initialOpen: true },
						el( ToggleControl, {
							label: __( 'Show heading block', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.showHeading,
							onChange: ( value ) => setAttributes( { showHeading: value } ),
						} ),
						attributes.showHeading &&
							el( TextControl, {
								label: __( 'Eyebrow', 'ucla-wordpress-plugin-ext' ),
								value: attributes.eyebrow,
								onChange: ( value ) => setAttributes( { eyebrow: value } ),
							} ),
						attributes.showHeading &&
							el( TextControl, {
								label: __( 'Heading', 'ucla-wordpress-plugin-ext' ),
								value: attributes.heading,
								onChange: ( value ) => setAttributes( { heading: value } ),
							} ),
						el( TextControl, {
							label: __( '"View all" URL', 'ucla-wordpress-plugin-ext' ),
							help: __( 'Leave blank to hide the link.', 'ucla-wordpress-plugin-ext' ),
							type: 'url',
							value: attributes.viewAllUrl,
							onChange: ( value ) => setAttributes( { viewAllUrl: value } ),
						} ),
						el( TextControl, {
							label: __( '"View all" label', 'ucla-wordpress-plugin-ext' ),
							value: attributes.viewAllLabel,
							onChange: ( value ) => setAttributes( { viewAllLabel: value } ),
						} )
					),
					el(
						PanelBody,
						{ title: __( 'Layout', 'ucla-wordpress-plugin-ext' ), initialOpen: true },
						el( SelectControl, {
							label: __( 'Row layout', 'ucla-wordpress-plugin-ext' ),
							value: attributes.layout,
							options: [
								{ label: __( 'Expanded', 'ucla-wordpress-plugin-ext' ), value: 'expanded' },
								{ label: __( 'Compact', 'ucla-wordpress-plugin-ext' ), value: 'compact' },
							],
							onChange: ( value ) => setAttributes( { layout: value } ),
						} ),
						el( ToggleControl, {
							label: __( 'Show date block', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.showDateBlock,
							onChange: ( value ) => setAttributes( { showDateBlock: value } ),
						} ),
						el( ToggleControl, {
							label: __( 'Show time and venue line', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.showMeta,
							onChange: ( value ) => setAttributes( { showMeta: value } ),
						} )
					),
					el(
						PanelBody,
						{ title: __( 'Events', 'ucla-wordpress-plugin-ext' ), initialOpen: true },
						el( RangeControl, {
							label: __( 'Number of events', 'ucla-wordpress-plugin-ext' ),
							value: attributes.count,
							min: 1,
							max: 20,
							onChange: ( value ) => setAttributes( { count: value } ),
						} ),
						el( SelectControl, {
							label: __( 'Date range', 'ucla-wordpress-plugin-ext' ),
							value: attributes.dateRange,
							options: [
								{
									label: __( 'Upcoming (any future)', 'ucla-wordpress-plugin-ext' ),
									value: 'upcoming',
								},
								{ label: __( 'This month', 'ucla-wordpress-plugin-ext' ), value: 'this_month' },
								{ label: __( 'Next 30 days', 'ucla-wordpress-plugin-ext' ), value: 'next_30' },
								{ label: __( 'Custom range', 'ucla-wordpress-plugin-ext' ), value: 'custom' },
							],
							onChange: ( value ) => setAttributes( { dateRange: value } ),
						} ),
						attributes.dateRange === 'custom' &&
							el( TextControl, {
								label: __( 'Start date (YYYY-MM-DD)', 'ucla-wordpress-plugin-ext' ),
								value: attributes.startDate,
								onChange: ( value ) => setAttributes( { startDate: value } ),
							} ),
						attributes.dateRange === 'custom' &&
							el( TextControl, {
								label: __( 'End date (YYYY-MM-DD)', 'ucla-wordpress-plugin-ext' ),
								value: attributes.endDate,
								onChange: ( value ) => setAttributes( { endDate: value } ),
							} ),
						el( ToggleControl, {
							label: __( 'Featured events only', 'ucla-wordpress-plugin-ext' ),
							checked: attributes.featuredOnly,
							onChange: ( value ) => setAttributes( { featuredOnly: value } ),
						} ),
						el( FormTokenField, {
							label: __( 'Event categories', 'ucla-wordpress-plugin-ext' ),
							value: selectedCatNames,
							suggestions: catSuggestions,
							onChange: ( names ) => {
								const ids = names
									.map( ( name ) => categories.find( ( term ) => term.name === name )?.id )
									.filter( Boolean );
								setAttributes( { categoryIds: ids } );
							},
						} ),
						el( FormTokenField, {
							label: __( 'Venues', 'ucla-wordpress-plugin-ext' ),
							value: selectedVenueNames,
							suggestions: venueSuggestions,
							onChange: ( names ) => {
								const ids = names
									.map( ( name ) => {
										const venue = venues.find(
											( item ) => ( item.title?.rendered || item.title ) === name
										);
										return venue ? venue.id : null;
									} )
									.filter( Boolean );
								setAttributes( { venueIds: ids } );
							},
						} )
					),
					el(
						PanelBody,
						{ title: __( 'Styles', 'ucla-wordpress-plugin-ext' ), initialOpen: false },
						el( 'p', null, __( 'Background color', 'ucla-wordpress-plugin-ext' ) ),
						el( ColorPalette, {
							value: attributes.backgroundColor || '',
							colors: [
								{ name: 'Light Gray', color: '#f2f2f2' },
								{ name: 'White', color: '#ffffff' },
								{ name: 'UCLA Blue', color: '#2774ae' },
								{ name: 'UCLA Gold', color: '#ffd100' },
								{ name: 'Transparent', color: 'transparent' },
							],
							enableAlpha: true,
							onChange: ( value ) => setAttributes( { backgroundColor: value || '' } ),
							clearable: true,
						} )
					)
				),
				el(
					'div',
					{
						...blockProps,
						style: blockWrapperStyle,
						onClickCapture: stopPreviewNavigation,
					},
					el( ServerSideRender, {
						block: 'ucla/tec-events',
						attributes: previewAttributes,
						skipBlockSupportAttributes: true,
						EmptyResponsePlaceholder: () => el( SampleList, { attributes: previewAttributes } ),
						LoadingResponsePlaceholder: () =>
							el(
								Placeholder,
								{ label: __( 'UCLA Events List', 'ucla-wordpress-plugin-ext' ) },
								el( Spinner, null )
							),
					} )
				)
			);
		},
		save: () => null,
	} );

	function SampleList( { attributes } ) {
		const selectedBackgroundColor =
			attributes.backgroundColor || attributes.style?.color?.background || '';
		const samples = [
			{
				month: 'MAY',
				day: '02',
				title: 'UCLA Public Lecture: Climate Futures in Los Angeles',
				kind: 'Lecture',
				time: '4:00 PM',
				venue: 'Royce Hall',
			},
			{
				month: 'MAY',
				day: '08',
				title: 'Graduate Research Showcase',
				kind: 'Symposium',
				time: '9:00 AM',
				venue: 'Ackerman Grand Ballroom',
			},
			{
				month: 'MAY',
				day: '14',
				title: 'UCLA Faculty Talk: AI and Society',
				kind: 'Talk',
				time: '3:30 PM',
				venue: 'Kerckhoff Hall',
			},
			{
				month: 'MAY',
				day: '21',
				title: 'Bruin Community Open House',
				kind: 'Community Event',
				time: '10:00 AM',
				venue: 'Wilson Plaza',
			},
		].slice( 0, attributes.count || 4 );

		return el(
			'section',
			{
				className: `ucla-tec ucla-tec--${ attributes.layout } is-editor-sample`,
				style: selectedBackgroundColor ? { backgroundColor: selectedBackgroundColor } : undefined,
			},
			el(
				'div',
				{ className: 'ucla-tec__sample-notice' },
				__(
					'Showing sample events. Add published events in The Events Calendar to display live event data.',
					'ucla-wordpress-plugin-ext'
				)
			),
			attributes.showHeading &&
				el(
					'header',
					{ className: 'ucla-tec__head' },
					el(
						'div',
						null,
						attributes.eyebrow && el( 'p', { className: 'ucla-tec__eyebrow' }, attributes.eyebrow ),
						attributes.heading && el( 'h2', { className: 'ucla-tec__title' }, attributes.heading )
					),
					attributes.viewAllLabel &&
						el( 'span', { className: 'ucla-tec__view-all' }, attributes.viewAllLabel, ' ->' )
				),
			el(
				'ol',
				{ className: 'ucla-tec__list' },
				samples.map( ( eventItem, index ) =>
					el(
						'li',
						{ key: index, className: 'ucla-tec__item' },
						el(
							'div',
							{ className: 'ucla-tec__row' },
							attributes.showDateBlock &&
								el(
									'div',
									{ className: 'ucla-tec__date' },
									el( 'span', { className: 'ucla-tec__month' }, eventItem.month ),
									el( 'span', { className: 'ucla-tec__day' }, eventItem.day )
								),
							el(
								'div',
								{ className: 'ucla-tec__body' },
								el( 'h3', { className: 'ucla-tec__event-title' }, eventItem.title ),
								attributes.showMeta &&
									el(
										'p',
										{ className: 'ucla-tec__meta' },
										[ eventItem.kind, eventItem.time, eventItem.venue ]
											.filter( Boolean )
											.join( ' · ' )
									)
							),
							el( 'span', { className: 'ucla-tec__cta' }, __( 'Details ->', 'ucla-wordpress-plugin-ext' ) )
						)
					)
				)
			)
		);
	}
} )( window.wp );
