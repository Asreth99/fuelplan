

export default function calculateFuelCost(distance: number, consumption: number, price: number): number {
    const litersNeeded = (distance / 100) * consumption;
    const totalCost = litersNeeded * price;
    return totalCost;
}