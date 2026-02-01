import './CostDisplay.css';

export default function CostDisplay({ cost, className = '' }) {
    if (cost === undefined || cost === null) return null;

    return (
        <span className={`cost-display ${className}`} title="Estimated Cost">
            ${Number(cost).toFixed(6)}
        </span>
    );
}
