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

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:5232/hubs/cars") // adjust backend URL/port
            .withAutomaticReconnect()
            .build();

        connection.on("CarExpired", (payload: any) => {
            // backend may send full Car or just an id; handle both
            const car: Car = typeof payload === "string" ? { id: payload, color: "", make: "", model: "", validTill: "" } : payload as Car;
            setExpiredCars(prev => {
                if (!prev.find(c => c.id === car.id)) return [...prev, car];
                return prev;
            });
        });

        connection.start().catch(err => console.error("SignalR Connection Error:", err));

        return () => {
            connection.stop().catch(() => {/* ignore stop errors */});
        };
    }, []);

    // Merge API cars with expired cars
    const displayCars = cars.map(c => {
        const isExpired = expiredCars.some(e => e.id === c.id) || new Date(c.validTill) < new Date();
        return { ...c, isExpired };
    });

    return (
        <main className="flex items-center justify-center pt-16 pb-4">
            <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
                <PageHeader />
                <div className="max-w-[600px] w-full space-y-6 px-4">
                    <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 space-y-4 text-gray-700 dark:text-gray-300">
                        <ul className="flex flex-col divide-y divide-gray-700 place-items-center w-full">
                            <li className="text-gray-700 font-bold dark:text-gray-300 flex flex-row justify-between py-1.5 px-0.5 gap-1.5 w-full">
                                <p>Rego &amp; Make</p>
                                <p>Validity</p>
                            </li>

                            {displayCars.length ? (
                                displayCars.map(({ id, color, make, model, validTill, isExpired }) => {
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
