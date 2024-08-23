let currentThreadId = null;

const query = (obj) =>
    Object.keys(obj)
        .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
        .join("&");
const colorThemes = document.querySelectorAll('[name="theme"]');
const markdown = window.markdownit();
const message_box = document.getElementById(`messages`);
// const message_input = document.getElementById(`message-input`);
const box_conversations = document.querySelector(`.top`);
const spinner = box_conversations.querySelector(".spinner");
const stop_generating = document.querySelector(`.stop_generating`);
const send_button = document.querySelector(`#send-button`);
const messageInput = document.getElementById('message-input');
const fetchData = document.getElementById('fetchData');
const messagesContainer = document.getElementById('messages');
const text = messageInput.value.trim();
// const uniqueThreadId = `thread_${Date.now()}`;
const md = window.markdownit();
let prompt_lock = false;

// hljs.addPlugin(new CopyButtonPlugin());

function resizeTextarea(textarea) {
    textarea.style.height = '70px';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

document.querySelector(".mobile-sidebar").addEventListener("click", (event) => {
    const sidebar = document.querySelector(".conversations");

    if (sidebar.classList.contains("shown")) {
        sidebar.classList.remove("shown");
        event.target.classList.remove("rotated");
    } else {
        sidebar.classList.add("shown");
        event.target.classList.add("rotated");
    }

    window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', function () {
    fetchAllThreads();
});

document.getElementById('new_convo').addEventListener('click', function () {
    //addThreadToThreadsDiv("thread_lF9tOfU3SjzxRsnxfQAieR4g");
    fetchNewThreadId();

});

//to fecth all the threads
async function fetchAllThreads() {
    try {
        const response = await fetch("http://localhost:5111/Thread/GetAllThread");
        const data = await response.json();
        data.forEach(thread => {
            addThreadToThreadsDiv(thread);
        });
    } catch (error) {
        console.error('Error fetching threads:', error);
    }
}


async function fetchNewThreadId() {
    try {
        const response = await fetch("http://localhost:5111/Thread/CreateThread");
        const data = await response.json();
        addThreadToThreadsDiv(data.threadId);
        currentThreadId = data.threadId;
        return data.threadId; // Return the new threadId
    } catch (error) {
        console.error('Error creating thread:', error);
    }
}


function addThreadToThreadsDiv(threadId) {
    const threadsDiv = document.querySelector('.threads');
    if (!threadsDiv) {
        console.error('Threads div not found');
        return;
    }

    const threadItem = document.createElement('div');
    threadItem.className = 'thread-item';
    threadItem.innerHTML = `<span>${threadId}</span>`;
    threadsDiv.appendChild(threadItem);

    // Apply styles to prevent overflow
    threadItem.style.whiteSpace = 'nowrap';
    threadItem.style.padding = '5px 10px 5 px 5px';
    threadItem.style.border = '1px solid white';
    threadItem.style.borderRadius = '10px';
    threadItem.style.marginBottom = '5px';
    threadItem.style.marginRight = '5px';
    threadItem.style.textOverflow = 'ellipsis';
    threadItem.style.maxWidth = '100%'; // Ensure it does not exceed the parent div's width
    threadItem.style.display = 'block'; // Or 'inline-block'
    threadItem.style.overflow = 'hidden';

    threadItem.addEventListener('click', () => {
        currentThreadId = threadId;
        displayMessages(threadId);
    });

    threadsDiv.insertBefore(threadItem, threadsDiv.firstChild);

}

// Ensure the container can scroll vertically when there are many thread items
document.querySelector('.threads').style.overflowY = 'auto';


async function displayMessages(threadId) {
    const messagesContainer = document.getElementById('messages'); // Assuming you have an element with id 'messages'

    // Fetch messages from an API
    const response = await fetch(`http://localhost:5111/Thread/GetAllMessages?threadId=${threadId}`);
    //const response = await fetch(`http://localhost:5111/Thread/GetAllMessages?threadId=thread_lF9tOfU3SjzxRsnxfQAieR4g`);
    const sampleMessages = await response.json(); // Assuming the API returns JSON in the expected format

    messagesContainer.innerHTML = ''; // Clear previous messages
    sampleMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', message.Role.toLowerCase() + '-message');
        // Apply different styling based on the message role
        if (message.Role.toLowerCase() === 'user') {
            messageElement.style.padding = '10px';
            messageElement.style.alignSelf = 'flex-end';
        } else {
            messageElement.style.padding = '10px';
        }
        messageElement.style.width = 'fit-content';
        messageElement.style.maxWidth = '80%';
        messageElement.style.lineHeight = '1.5';
        messageElement.style.backgroundColor = '#84719040';
        messageElement.style.margin = '10px';
        messageElement.style.borderRadius = '10px';
        const cleanedContent = message.Content[0].Text.replace(/【.*?】/g, '');

        // Render the cleaned content
        const renderedContent = md.render(cleanedContent);
        messageElement.innerHTML = `${renderedContent}`;
        console.log(renderedContent);
        messagesContainer.appendChild(messageElement);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage(text, threadId) {
    const response = await fetch(`http://localhost:5111/Thread/SendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ threadId, text })
    });

    if (!response.ok) {
        console.error('Error sending message:', await response.text());
        messageInput.disabled = false; // Re-enable input field if there's an error
        messageInput.value = ''; // Clear input field if there's an error
        return;
    }

    console.log('Message sent successfully:', await response.json());
    await displayMessages(currentThreadId);
}

async function handleSendMessage() {
    const text = messageInput.value.trim();
    if (text === '') {
        console.log('Input field is empty. Not sending message.');
        return;
    }

    messageInput.disabled = true; // Disable input field
    messageInput.value = '';
    messageInput.placeholder = ''; // Clear the input field immediately
    showGeneratingText(); // Show generating text with animation
    if (!currentThreadId) {
        currentThreadId = await fetchNewThreadId(); // Create a new thread if none exists
    }
    await sendMessage(text, currentThreadId);

    messageInput.disabled = false; // Re-enable input field
    removeGeneratingText();
    messageInput.placeholder = 'Ask a question..';
    resizeTextarea(messageInput); // Reset the textarea size
}

function showGeneratingText() {
    const generatingText = document.createElement('div');
    generatingText.id = 'generating-text';
    generatingText.innerText = 'Generating';
    generatingText.style.position = 'absolute';
    generatingText.style.left = '10px';
    generatingText.style.top = '50%';
    generatingText.style.transform = 'translateY(-50%)';
    generatingText.style.color = 'gray';
    generatingText.style.pointerEvents = 'none'; // Make sure the element does not block mouse events
    document.querySelector('.input-box').appendChild(generatingText);



    let dotCount = 0;
    generatingText.animationInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        generatingText.innerText = 'Generating' + '.'.repeat(dotCount);
    }, 500);
}

function removeGeneratingText() {
    const generatingText = document.getElementById('generating-text');
    if (generatingText) {
        clearInterval(generatingText.animationInterval);
        generatingText.remove();
    }
}

send_button.addEventListener('click', handleSendMessage);

messageInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
    }
});

messageInput.addEventListener('input', function () {
    resizeTextarea(this);
});

// const delete_conversations = async () => {
//     location.reload();
// };

async function delete_conversations() {
    if (!currentThreadId) {
        console.error('No thread selected to delete');
        return;
    }

    try {
        // Call the delete thread API
        const response = await fetch(`http://localhost:5111/Thread?threadId=${currentThreadId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            console.error('Error deleting thread:', await response.text());
            return;
        }

        console.log('Thread deleted successfully');

        // Clear the messages box
        message_box.innerHTML = '';

        // Remove the thread from the threads div
        const threadItems = document.querySelectorAll('.thread-item');
        threadItems.forEach(item => {
            const span = item.querySelector('span');
            if (span && span.textContent === currentThreadId) {
                item.remove();
            }
        });

        // Reset the currentThreadId
        currentThreadId = null;


    } catch (error) {
        console.error('Error deleting thread:', error);
    }
}