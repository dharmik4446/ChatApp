//creates new thread on click
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
document.getElementById('createNewThread').addEventListener('click', createNewThread);

//display the thread messgaes
function fetchAndDisplayMessages(threadId) {
    const apiUrl = `http://localhost:5111/Thread/GetAllMessages?threadId=${threadId}`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(messages => {
            const messagesContainer = document.getElementById('messagesContainer');
            messagesContainer.innerHTML = ''; // Clear previous messages
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message');
                messageElement.innerText = message.Content[0].Text;
                messagesContainer.appendChild(messageElement);
            });
        })
        .catch(error => console.error('Error fetching messages:', error));
}

// Example usage
document.getElementById('fetchData').addEventListener('click', () => fetchAndDisplayMessages('thread_lF9tOfU3SjzxRsnxfQAieR4g')); 