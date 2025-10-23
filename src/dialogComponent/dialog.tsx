type DialogProps = {
  onClose: () => void;
  totalCost: string;    
};
export default function Dialog({ onClose, totalCost }: DialogProps) {
  return (
    <div className="modal">
      <h1>Total</h1>
      <div>
        Total Cost: <strong>{totalCost}Ft</strong>
      </div><br />

      <button className="button" onClick={onClose}>Close</button><br />
    </div>
  );
}
