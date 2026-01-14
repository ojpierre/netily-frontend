import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Placeholder API utility (to be implemented)
async function fetchHotspotPlans(routerId: string) {
  // TODO: Replace with real API call
  return [
    { id: 1, name: "1 Hour", price: 50, duration: "1h", speed: "5Mbps" },
    { id: 2, name: "1 Day", price: 200, duration: "24h", speed: "10Mbps" },
  ];
}

export default function HotspotPage({ params }: { params: { router_id: string } }) {
  const routerId = params.router_id;
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHotspotPlans(routerId)
      .then(setPlans)
      .catch(() => setError("Failed to load plans."))
      .finally(() => setLoading(false));
  }, [routerId]);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    // TODO: Integrate payment and access purchase API
    setTimeout(() => {
      setPaying(false);
      setSuccess(true);
    }, 2000);
  };

  if (loading) return <div className="p-8 text-center">Loading plans...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;
  if (success) return <div className="p-8 text-green-600 text-center">Payment successful! You are now connected.</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">Connect to Hotspot</h1>
      <p className="mb-6 text-center">Select a plan to get online.</p>
      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded p-4 cursor-pointer ${selectedPlan?.id === plan.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            onClick={() => setSelectedPlan(plan)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{plan.name}</div>
                <div className="text-sm text-gray-500">{plan.duration} • {plan.speed}</div>
              </div>
              <div className="text-lg font-bold">KES {plan.price}</div>
            </div>
          </div>
        ))}
      </div>
      <button
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        disabled={!selectedPlan || paying}
        onClick={handlePay}
      >
        {paying ? "Processing..." : selectedPlan ? `Pay KES ${selectedPlan.price} & Connect` : "Select a Plan"}
      </button>
    </div>
  );
}
