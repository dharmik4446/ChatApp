let currentThreadId = null;

const query = (obj) =>
    Object.keys(obj)
        .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
        .join("&");
const colorThemes = document.querySelectorAll('[name="theme"]');
const markdown = window.markdownit();
const message_box = document.getElementById(`messages`);
const box_conversations = document.querySelector(`.top`);
const spinner = box_conversations.querySelector(".spinner");
const stop_generating = document.querySelector(`.stop_generating`);
const send_button = document.querySelector(`#send-button`);
const messageInput = document.getElementById('message-input');
const fetchData = document.getElementById('fetchData');
const messagesContainer = document.getElementById('messages');
const text = messageInput.value.trim();
const md = window.markdownit();
let prompt_lock = false;

hljs.addPlugin(new CopyButtonPlugin());

document.addEventListener('DOMContentLoaded', () => {
    const mobileSidebar = document.querySelector('.mobile-sidebar');
    const conversations = document.querySelector('.conversations');

    if (mobileSidebar && conversations) {
        mobileSidebar.addEventListener('click', () => {
            conversations.classList.toggle('shown');
        });
    }
});

// document.addEventListener('DOMContentLoaded', function () {
//     fetchAllThreads();
// });

document.getElementById('new_convo').addEventListener('click', function () {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '<div class="loading">Creating Thread...</div>';
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
        displayMessages(data.threadId);
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

    threadItem.addEventListener('click', async () => {
        currentThreadId = threadId;

        document.querySelectorAll('.thread-item').forEach(item => {
            item.style.backgroundColor = 'Black'; // Default background color
        });

        // Change background color of the clicked thread item
        threadItem.style.backgroundColor = '#4b314b';

        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '<div class="loading">Loading...</div>';
        displayMessages(threadId);
    });

    threadsDiv.insertBefore(threadItem, threadsDiv.firstChild);

}


//hower effect on the thread-item
document.addEventListener('DOMContentLoaded', () => {
    const threadItems = document.querySelectorAll('.thread-item');
    threadItems.forEach(item => {
        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#c281ea40'; // Change background color on hover
        });

        item.addEventListener('mouseout', () => {
            // Revert back to default background color on hover out
            item.style.backgroundColor = 'Black';
        });
    });
});

async function displayMessages(threadId) {
    const messagesContainer = document.getElementById('messages'); // Assuming you have an element with id 'messages'

    const response = await fetch(`http://localhost:5111/Thread/GetAllMessages?threadId=${threadId}`);
    const sampleMessages = await response.json();
    messagesContainer.innerHTML = ''; // Clear previous messages before rendering new ones
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
        messageElement.style.borderRadius = '6px';
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