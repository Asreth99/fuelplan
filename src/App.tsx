import './style.css';
import { useState } from 'react';
import SideBar from './sidebar/sidebar';
import Calculator from './calculator/calculator';
import MapComponent from './googleMap/googleMap';
import AutocompleteForm from './googleMap/autocompleteForm';
import { LoadScript } from '@react-google-maps/api';


function ReFuel() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [requestDirections, setRequestDirections] = useState(false);

  
  const handleSubmit = () => {
    setRequestDirections(true);
  };

  return (
    <div style={{position: 'relative', display: "flex", height: "100vh"}}>
      <LoadScript
        googleMapsApiKey="AIzaSyAi17AEaHewcvBOByq2cZo7Pe8XJOcRlq4"
        libraries={['places']}
      >
      <SideBar 
        origin={origin} 
        setOrigin={setOrigin} 
        destination={destination} 
        setDestination={setDestination} 
        directions={directions}
        onSubmit={handleSubmit}
      />

      <MapComponent 
        origin={origin} 
        destination={destination} 
        directions={directions} 
        setDirections={setDirections}
        requestDirections={requestDirections}
        setRequestDirections={setRequestDirections}
      />

      </LoadScript>
 
    </div>

  );
}

export default ReFuel;
