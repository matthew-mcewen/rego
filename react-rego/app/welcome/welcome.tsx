import {useEffect, useState} from "react";

export function Welcome() {

    // We track optional queries with useState
    const [filterActive, setFilterActive] = useState<boolean>(false);
    const [filterQuery, setFilterQuery] = useState<string>('');

    // We track cars list with useState
    // useEffect receives data from backend and updates useState hook accordingly
    const [cars, setCars] = useState<number[]>([]);
    useEffect(() => {if (someCars) {setCars(someCars)}}, [filterQuery]);

    return (
        <main className="flex items-center justify-center pt-16 pb-4">
            <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
                <header className="flex flex-col items-center gap-9">
                    <div className="w-[500px] max-w-[100vw] p-4">
                        <h1 className="text-6xl text-center mx-auto">Rego Check</h1>
                    </div>
                </header>
                <div className="max-w-[600px] w-full space-y-6 px-4">
                    <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
                        <div className="flex flex-row w-fit mx-auto justify-center gap-3 lg:gap-6 text-gray-700 dark:text-gray-300">
                            <label htmlFor={"all"} className="flex gap-1">
                                <input
                                    type="radio" name="queryParam" id="showAll"
                                    onSelect={e => {
                                        setFilterActive(false);
                                        setFilterQuery('');
                                    }}
                                />
                                All Vehicles
                            </label>
                            <label htmlFor={"all"} className="flex gap-1">
                                <input
                                    type="radio" name="queryParam" id="filterByMake"
                                    onSelect={e => {setFilterActive(true)}}
                                />
                                <input
                                    type="text" name="queryMake" id="queryMakeValue" placeholder="Make..."
                                    disabled={filterActive}
                                    onChange={e => {
                                        setFilterQuery(e.target.value);
                                    }}
                                    className="rounded-lg focus:outline-b px-1"
                                />
                            </label>
                        </div>
                        <ul className="flex flex-col divide-y divide-gray-700 place-items-center w-full">
                            <li className="text-gray-700 font-bold dark:text-gray-300 flex flex-row justify-between py-1.5 px-0.5 gap-1.5 w-full">
                                <p>Rego</p>
                                <p>Make</p>
                                <p>Model</p>
                            </li>
                            {cars.length ? cars.map(({ id, color, make, model, validTill }) => (
                                <li key={id} className="grid grid-cols-3 py-1.5 w-full">
                                    <p className={"text-left"}>{id}</p>
                                    <p className={"text-center"}>{make}</p>
                                    <p className={"text-right"}>{model}</p>
                                </li>
                            )) : (
                                <p className={"p-1.5"}>No vehicles match requested criteria</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}

// mock data for now
const someCars = [
    {
        id: 'ABC123',
        color: 'blue',
        make: 'Coolwheels',
        model: 'Sedan',
        validTill: '2025-12-23T16:00:00Z'
    },
    {
        id: 'ABC234',
        color: 'green',
        make: 'Coolwheels',
        model: 'Hatchback',
        validTill: '2025-12-23T16:00:00Z'
    },
    {
        id: 'TUV345',
        color: 'red',
        make: 'Fort',
        model: 'Mustache',
        validTill: '2025-12-23T16:00:00Z'
    },
    {
        id: 'XYZ456',
        color: 'yellow',
        make: 'Holdin\'',
        model: 'Admiral',
        validTill: '2025-12-22T10:00:00Z'
    },
];
