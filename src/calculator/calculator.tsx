import { useState } from 'react';
import { createPortal } from 'react-dom';
import Dialog from "../dialogComponent/dialog"
import  calculateTotalCost  from './helper';


export default function Calculator() {
    const [distance, setDistance] = useState('');
    const [consumption, setConsumption] = useState('');
    const [price, setPrice] = useState('');
    const [totalCost, setTotalCost] = useState<number | 0>(0);

    const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="App">
        <label htmlFor="fuel-input">Full distance:</label><br />
        <input 
            type="number"
            value={distance}
            onChange={event =>{
            setDistance(event.target.value);
        }} /><br /><br />

        <label htmlFor="fuel-input">Consumption (l/100km):</label><br />
        <input 
            type="number"
            value={consumption}
            onChange={event =>{
            setConsumption(event.target.value);
        }} /><br /><br />

        <label htmlFor="fuel-input">Full price:</label><br />
        <input 
            type="number"
            value={price}
            onChange={event =>{
            setPrice(event.target.value);
        }} /><br /><br />

        <button className='button'
         onClick={() => {
            setShowDialog(true);
            setTotalCost(calculateTotalCost(Number(distance), Number(consumption), Number(price)));
         }}>Calculate</button><br/>

        {showDialog && createPortal(
            <Dialog 
            onClose={() => setShowDialog(false)}
            totalCost={totalCost.toFixed(0)}
            />
        , document.body 
        )}
    </div>
  );
}