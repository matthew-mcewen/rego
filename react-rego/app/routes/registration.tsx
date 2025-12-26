import type { Route } from "./+types/home";
import { type Car, NoMatches, PageHeader } from "~/welcome/welcome";
import { useEffect, useState } from "react";
import { ApiGet } from "~/welcome/ApiGet";
import * as signalR from "@microsoft/signalr";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Rego Check" },
        { name: "description", content: "Welcome to Rego Check!" },
    ];
}

export default function Registration() {
    return <RegoExpiryList />;
}

function RegoExpiryList() {
    // Track cars from API
    const [cars, setCars] = useState<Car[]>([]);
    useEffect(() => {
        ApiGet('cars').then(res => setCars(res));
    }, []);

    // Track expired cars (SignalR)
    const [expiredCars, setExpiredCars] = useState<Car[]>([]);

    // Connection status for banner
    const [connState, setConnState] =
        useState<'Disconnected' | 'Connecting' | 'Connected'>('Disconnected');

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5232/hubs/cars")
            .withAutomaticReconnect()
            .build();

        connection.onclose(() => {
            setConnState('Disconnected');
        });

        // FULL STATE ON CONNECT / RE-SYNC
        connection.on("CarExpiredBatch", (cars: Car[]) => {
            setExpiredCars(prev => {
                const map = new Map(prev.map(c => [c.id, c]));
                cars.forEach(c => map.set(c.id, c));
                return Array.from(map.values());
            });
        });

        // INCREMENTAL UPDATES
        connection.on("CarExpired", (payload: any) => {
            const car: Car = typeof payload === "string"
                ? { id: payload, color: "", make: "", model: "", validTill: "" }
                : payload as Car;

            setExpiredCars(prev => {
                if (!prev.find(c => c.id === car.id)) return [...prev, car];
                return prev;
            });
        });

        setConnState('Connecting');
        connection.start()
            .then(() => setConnState('Connected'))
            .catch(err => {
                console.error("SignalR Connection Error:", err);
                setConnState('Disconnected');
            });

        return () => {
            connection.stop().catch(() => {});
            setConnState('Disconnected');
        };
    }, []);

    // Merge API cars with expired cars
    const displayCars = cars.map(c => {
        const isExpired =
            expiredCars.some(e => e.id === c.id) ||
            new Date(c.validTill) < new Date();
        return { ...c, isExpired };
    });

    return (
        <main className="flex items-center justify-center pt-16 pb-4">
            <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
                <PageHeader />

                <div className="w-full max-w-[600px] px-4">
                    <div className={`mx-auto text-sm w-fit px-3 py-1 rounded-md border ${
                        connState === 'Connected'
                            ? 'bg-blue-50 dark:bg-blue-800/50 border-blue-200 dark:border-blue-200/50 text-blue-800 dark:text-blue-200'
                            : connState === 'Connecting'
                                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                : 'bg-red-50 border-red-200 dark:border-red-400/50 dark:bg-red-800/50 dark:text-red-200 text-red-800'
                    }`}>
                        Live updates {connState.toLowerCase()}.{" "}
                        <span className="font-bold">
                            Expired vehicles: {expiredCars.length}
                        </span>
                    </div>
                </div>

                <div className="max-w-[600px] w-full space-y-6 px-4">
                    <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 space-y-4 text-gray-700 dark:text-gray-300">
                        <ul className="flex flex-col divide-y divide-gray-700 place-items-center w-full">
                            <li className="text-gray-700 font-bold dark:text-gray-300 flex flex-row justify-between py-1.5 px-0.5 gap-1.5 w-full">
                                <p>Rego &amp; Make</p>
                                <p>Validity</p>
                            </li>

                            {displayCars.length ? (
                                displayCars.map(({ id, make, validTill, isExpired }) => {
                                    const textColorClass = isExpired
                                        ? "text-red-400 dark:text-red-400"
                                        : "text-black/80 dark:text-white/80";

                                    return (
                                        <li key={id} className="grid grid-cols-2 py-1.5 w-full">
                                            <p className="text-left">{id} {make}</p>
                                            <p className={`text-right ${textColorClass}`}>
                                                {isExpired && "Expired "}
                                                {validTill.substring(0, 10)}
                                            </p>
                                        </li>
                                    );
                                })
                            ) : (
                                <NoMatches />
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}

// export function ExpiredRegistration() {
//     const [expired, setExpired] = useState<Car[]>([]);
//     const connRef = useRef<any>(null);
//
//     useEffect(() => {
//         let mounted = true;
//
//         // load current expired list
//         fetch("/cars/expired")
//             .then((r) => (r.ok ? r.json() : []))
//             .then((data) => {
//                 if (mounted) setExpired(data);
//             })
//             .catch(() => {});
//
//         const connection = new HubConnectionBuilder()
//             .withUrl("/hubs/cars")
//             .withAutomaticReconnect()
//             .configureLogging(LogLevel.Warning)
//             .build();
//
//         connRef.current = connection;
//
//         connection.on("CarExpired", (car: Car) => {
//             setExpired((prev) => {
//                 // avoid duplicates by id
//                 if (prev.some((p) => p.id === car.id)) return prev;
//                 return [car, ...prev];
//             });
//         });
//
//         connection
//             .start()
//             .catch((err) => console.error("SignalR start error", err));
//
//         return () => {
//             mounted = false;
//             connection.stop().catch(() => {});
//         };
//     }, []);
//
//     return (
//         <div>
//             <h2>Registration (live)</h2>
//             <div style={{ marginBottom: 8 }}>
//                 Live updates pushed from the backend background service via SignalR.
//             </div>
//             <CarTable cars={expired} />
//         </div>
//     );
// }
