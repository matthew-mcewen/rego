import { useEffect, useState } from "react";
import { ApiGet } from "~/welcome/ApiGet";
import * as signalR from "@microsoft/signalr";

export type Car = {
    id: string;
    color: string;
    make: string;
    model: string;
    validTill: string;
};

export function Welcome() {
    // Track optional queries/filters
    const [filterActive, setFilterActive] = useState<boolean>(false);
    const [filterQuery, setFilterQuery] = useState<string>('');

    // Track cars from API
    const [cars, setCars] = useState<Car[]>([]);
    useEffect(() => {
        if (filterActive && filterQuery) {
            ApiGet(`cars?make=${filterQuery.toLowerCase()}`).then(res => setCars(res));
        } else {
            ApiGet('cars').then(res => setCars(res));
        }
    }, [filterQuery, filterActive]);

    // Track expired cars (SignalR)
    const [expiredCars, setExpiredCars] = useState<Car[]>([]);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:5232/hubs/cars") // adjust backend URL/port
            .withAutomaticReconnect()
            .build();

        connection.on("CarExpired", (payload: any) => {
            const car: Car = typeof payload === "string"
                ? { id: payload, color: "", make: "", model: "", validTill: "" }
                : payload as Car;

            setExpiredCars(prev => {
                // Avoid duplicates
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
        const isExpired = expiredCars.some(e => e.id === c.id);
        return { ...c, isExpired };
    });

    return (
        <main className="flex items-center justify-center pt-16 pb-4">
            <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
                <PageHeader/>

                <div className="max-w-[600px] w-full space-y-6 px-4">
                    <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 space-y-4 text-gray-700 dark:text-gray-300">
                        <div className="flex flex-row w-fit mx-auto justify-center gap-3 lg:gap-6">
                            <label htmlFor="showAll" className="flex gap-1">
                                <input
                                    type="radio" name="queryParam" id="showAll"
                                    onClick={() => {
                                        setFilterActive(false);
                                        // console.log('set filters inactive')
                                    }}
                                />
                                All Vehicles
                            </label>
                            <label htmlFor="filterByMake" className="flex gap-1">
                                <input
                                    type="radio" name="queryParam" id="filterByMake"
                                    onClick={() => {
                                        setFilterActive(true);
                                        // console.log('set filters active');
                                        // console.log('filter query: ' + filterQuery);
                                    }}
                                />
                                <input
                                    type="text"
                                    name="queryMake"
                                    id="queryMakeValue"
                                    placeholder="Make..."
                                    disabled={!filterActive}
                                    onChange={e => setFilterQuery(e.target.value)}
                                    className="rounded-lg focus:outline-b px-1"
                                />
                            </label>
                        </div>

                        <ul className="flex flex-col divide-y divide-gray-700 place-items-center w-full">
                            <li className="text-gray-700 font-bold dark:text-gray-300 flex flex-row justify-between py-1.5 px-0.5 gap-1.5 w-full">
                                <p>Rego</p>
                                <p>Make</p>
                                <p>Validity</p>
                            </li>

                            {displayCars.length ? displayCars.map(({ id, color, make, model, validTill, isExpired }) => (
                                <li
                                    key={id}
                                    className={`grid grid-cols-3 py-1.5 w-full ${isExpired ? 'bg-red-100 dark:bg-red-500/40' : ''}`}
                                >
                                    <p className="text-left">{id}</p>
                                    <p className="text-center">{make}</p>
                                    <p className="text-right">{model}</p>
                                </li>
                            )) : (<NoMatches/>)}
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}

export function PageHeader() {
    return (
        <header className="flex flex-col items-center gap-6">
            <div className="w-[500px] max-w-[100vw] p-4">
                <h1 className="text-3xl lg:text-6xl xl:text-7xl text-center mx-auto font-thin">Rego Check</h1>
            </div>
            <nav className="flex flex-row gap-1.5 lg:gap-3 justify-between mx-auto text-center">
                <a href="/" className="text-blue-500 dark:text-blue-400 hover:text-blue-300">Homepage</a>
                <a href="/registration" className="text-blue-500 dark:text-blue-400 hover:text-blue-300">Expirations</a>
            </nav>
        </header>
    );
}

export function NoMatches() {
    return (<p className="p-1.5">No vehicles match requested criteria</p>);
}
