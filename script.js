// Create and Send the request
// async function fetchAndLogData(apiUrl) {
//     try {
//         // Fetch data from the API
//         const response = await fetch(apiUrl, {
//             method: "GET",
//             mode: 'no-cors', // Corrected mode placement
//             headers: {
//                 'Content-Type': 'application/json;charset=UTF-8' // Corrected Content-Type header
//             },
//         });
//         if (response.body) {
//             const json = await response.json(); // Parse the JSON from the response
//             console.log(json);
//             return json;
//         } else {
//             console.log("No content returned from the API");
//             return null;
//         }
//     } catch (error) {
//         // Log any errors that occur during the fetch
//         console.error(error);
//     }
// }

// Example usage of the function
//fetchAndLogData('http://localhost:5111/Thread/CreateThread');


// let p = fetch("http://localhost:5111/Thread/CreateThread")
// p.then((response) => {
//     console.log(response)
//     return response.json()
// }).then((data) => {
//     console.log(data)
// }).catch((error) => {
//     console.log(error)
// })

function createNewThread() {
    fetch("http://localhost:5111/Thread/CreateThread")
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            console.log(data);
        })
        .catch((error) => {
            console.log(error);
        });
}
document.getElementById('fetchDataBtn').addEventListener('click', createNewThread);