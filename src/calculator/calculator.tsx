import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Dialog from "../dialogComponent/dialog"
import  calculateTotalCost  from './helper';
import './calculator.css';

type CalculatorProps = {
    directions: google.maps.DirectionsResult | null;
};

export default function Calculator({ directions }: CalculatorProps) {
    const [distance, setDistance] = useState('');
    const [consumption, setConsumption] = useState('');
    const [price, setPrice] = useState('');
    const [totalCost, setTotalCost] = useState<number | 0>(0);
    const restultDistance = directions?.routes[0].legs[0].distance?.value;

    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        if (restultDistance !== undefined) {
            setDistance((restultDistance / 1000).toFixed(0).toString());
        }
    }, [restultDistance]);

  return (
    <div style={{ padding: 20 }}>
        <label>Full distance:</label><br />
        <input 
            type="number"
            value={distance}
            onChange={event =>{
            setDistance(event.target.value);
        }} /><br /><br />

        <label>Consumption (l/100km):</label><br />
        <input 
            type="number"
            value={consumption}
            onChange={event =>{
            setConsumption(event.target.value);
        }} /><br /><br />

        <label>Full price:</label><br />
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