mapboxgl.accessToken = mapToken;


const map = new mapboxgl.Map({

    container: 'map',

    style: 'mapbox://styles/mapbox/streets-v12',

    center: listing.geometry.coordinates,

    zoom: 9

});

const marker = new mapboxgl.Marker({ color: '#2ECC71' })
    .setLngLat(listing.geometry.coordinates) //Listings.geometry.coordinates
    .setPopup(new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h4>${listing.title}</h4><p>Exact location will be provided after Booking!</p>`))
    .addTo(map); 