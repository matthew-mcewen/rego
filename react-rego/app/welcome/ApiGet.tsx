export async function ApiGet(endpoint: any) {
    const res = await fetch(`http://localhost:5232/${endpoint}`);
    console.log(res);
    return res.json();
}