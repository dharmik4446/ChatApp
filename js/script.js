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



document.getElementById('new_convo').addEventListener('click', function () {
    //addThreadToThreadsDiv("thread_lF9tOfU3SjzxRsnxfQAieR4g");
    fetchNewThreadId();

});
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

    //const shouldScrollToBottom = threadsDiv.scrollTop === threadsDiv.scrollHeight - threadsDiv.clientHeight;

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
    threadItem.style.overflow = 'hidden'; // Hide any overflow content

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
            messageElement.style.width = 'fit-content';
            messageElement.style.maxWidth = '80%';
        } else {
            messageElement.style.padding = '10px';
            messageElement.style.width = 'fit-content';
            messageElement.style.maxWidth = '80%';
        }
        messageElement.style.lineHeight = '1.5';
        messageElement.style.backgroundColor = '#84719040';
        //messageElement.style.width = 'fit-content';
        messageElement.style.borderRadius = '8px';
        messageElement.style.margin = '5px';
        //const renderedContent = md.render(message.Content[0].Text);
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

function resizeTextarea(textarea) {
    textarea.style.height = '70px';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

const delete_conversations = async () => {
    location.reload();
};


// new code
// const delete_conversations = async () => {
//     localStorage.clear();
//     await new_conversation();
// };

// const handle_ask = async () => {
//     message_input.style.height = `80px`;
//     message_input.focus();

//     window.scrollTo(0, 0);
//     let message = message_input.value;

//     if (message.length > 0) {
//         message_input.value = ``;
//         await ask_gpt(message);
//     }
// };

// const ask_gpt = async (message) => {
//     try {
//         message_input.value = ``;
//         message_input.innerHTML = ``;
//         message_input.innerText = ``;

//         add_conversation(window.conversation_id, message.substr(0, 20));
//         window.scrollTo(0, 0);
//         window.controller = new AbortController();

//         jailbreak = document.getElementById("jailbreak");
//         model = document.getElementById("model");
//         prompt_lock = true;
//         window.text = ``;
//         window.token = message_id();

//         stop_generating.classList.remove(`stop_generating-hidden`);

//         message_box.innerHTML += `
//             <div class="message">
//                 <div class="user">
//                     ${user_image}
//                     <i class="fa-regular fa-phone-arrow-up-right"></i>
//                 </div>
//                 <div class="content" id="user_${token}">
//                     ${format(message)}
//                 </div>
//             </div>
//         `;

//         /* .replace(/(?:\r\n|\r|\n)/g, '<br>') */

//         message_box.scrollTop = message_box.scrollHeight;
//         window.scrollTo(0, 0);
//         await new Promise((r) => setTimeout(r, 500));
//         window.scrollTo(0, 0);

//         message_box.innerHTML += `
//             <div class="message">
//                 <div class="user">
//                     ${gpt_image} <i class="fa-regular fa-phone-arrow-down-left"></i>
//                 </div>
//                 <div class="content" id="gpt_${window.token}">
//                     <div id="cursor"></div>
//                 </div>
//             </div>
//         `;

//         message_box.scrollTop = message_box.scrollHeight;
//         window.scrollTo(0, 0);
//         await new Promise((r) => setTimeout(r, 1000));
//         window.scrollTo(0, 0);

//         const response = await fetch(`/backend-api/v2/conversation`, {
//             method: `POST`,
//             signal: window.controller.signal,
//             headers: {
//                 "content-type": `application/json`,
//                 accept: `text/event-stream`,
//             },
//             body: JSON.stringify({
//                 conversation_id: window.conversation_id,
//                 action: `_ask`,
//                 model: model.options[model.selectedIndex].value,
//                 jailbreak: jailbreak.options[jailbreak.selectedIndex].value,
//                 meta: {
//                     id: window.token,
//                     content: {
//                         conversation: await get_conversation(window.conversation_id),
//                         internet_access: document.getElementById("switch").checked,
//                         content_type: "text",
//                         parts: [
//                             {
//                                 content: message,
//                                 role: "user",
//                             },
//                         ],
//                     },
//                 },
//             }),
//         });

//         const reader = response.body.getReader();

//         while (true) {
//             const { value, done } = await reader.read();
//             if (done) break;

//             chunk = new TextDecoder().decode(value);

//             if (
//                 chunk.includes(
//                     `<form id="challenge-form" action="/backend-api/v2/conversation?`
//                 )
//             ) {
//                 chunk = `cloudflare token expired, please refresh the page.`;
//             }

//             text += chunk;

//             // const objects         = chunk.match(/({.+?})/g);

//             // try { if (JSON.parse(objects[0]).success === false) throw new Error(JSON.parse(objects[0]).error) } catch (e) {}

//             // objects.forEach((object) => {
//             //     console.log(object)
//             //     try { text += h2a(JSON.parse(object).content) } catch(t) { console.log(t); throw new Error(t)}
//             // });

//             document.getElementById(`gpt_${window.token}`).innerHTML =
//                 markdown.render(text);
//             document.querySelectorAll(`code`).forEach((el) => {
//                 hljs.highlightElement(el);
//             });

//             window.scrollTo(0, 0);
//             message_box.scrollTo({ top: message_box.scrollHeight, behavior: "auto" });
//         }

//         // if text contains :
//         if (
//             text.includes(
//                 `instead. Maintaining this website and API costs a lot of money`
//             )
//         ) {
//             document.getElementById(`gpt_${window.token}`).innerHTML =
//                 "An error occured, please reload / refresh cache and try again.";
//         }

//         add_message(window.conversation_id, "user", message);
//         add_message(window.conversation_id, "assistant", text);

//         message_box.scrollTop = message_box.scrollHeight;
//         await remove_cancel_button();
//         prompt_lock = false;

//         await load_conversations(20, 0);
//         window.scrollTo(0, 0);
//     } catch (e) {
//         add_message(window.conversation_id, "user", message);

//         message_box.scrollTop = message_box.scrollHeight;
//         await remove_cancel_button();
//         prompt_lock = false;

//         await load_conversations(20, 0);

//         console.log(e);

//         let cursorDiv = document.getElementById(`cursor`);
//         if (cursorDiv) cursorDiv.parentNode.removeChild(cursorDiv);

//         if (e.name != `AbortError`) {
//             let error_message = `oops ! something went wrong, please try again / reload. [stacktrace in console]`;

//             document.getElementById(`gpt_${window.token}`).innerHTML = error_message;
//             add_message(window.conversation_id, "assistant", error_message);
//         } else {
//             document.getElementById(`gpt_${window.token}`).innerHTML += ` [aborted]`;
//             add_message(window.conversation_id, "assistant", text + ` [aborted]`);
//         }

//         window.scrollTo(0, 0);
//     }
// };

// const remove_cancel_button = async () => {
//     stop_generating.classList.add(`stop_generating-hiding`);

//     setTimeout(() => {
//         stop_generating.classList.remove(`stop_generating-hiding`);
//         stop_generating.classList.add(`stop_generating-hidden`);
//     }, 300);
// };


// const clear_conversations = async () => {
//     const elements = box_conversations.childNodes;
//     let index = elements.length;

//     if (index > 0) {
//         while (index--) {
//             const element = elements[index];
//             if (
//                 element.nodeType === Node.ELEMENT_NODE &&
//                 element.tagName.toLowerCase() !== `button`
//             ) {
//                 box_conversations.removeChild(element);
//             }
//         }
//     }
// };

// const clear_conversation = async () => {
//     let messages = message_box.getElementsByTagName(`div`);

//     while (messages.length > 0) {
//         message_box.removeChild(messages[0]);
//     }
// };

// const show_option = async (conversation_id) => {
//     const conv = document.getElementById(`conv-${conversation_id}`);
//     const yes = document.getElementById(`yes-${conversation_id}`);
//     const not = document.getElementById(`not-${conversation_id}`);

//     conv.style.display = "none";
//     yes.style.display = "block";
//     not.style.display = "block";
// }

// const hide_option = async (conversation_id) => {
//     const conv = document.getElementById(`conv-${conversation_id}`);
//     const yes = document.getElementById(`yes-${conversation_id}`);
//     const not = document.getElementById(`not-${conversation_id}`);

//     conv.style.display = "block";
//     yes.style.display = "none";
//     not.style.display = "none";
// }

// const delete_conversation = async (conversation_id) => {
//     localStorage.removeItem(`conversation:${conversation_id}`);

//     const conversation = document.getElementById(`convo-${conversation_id}`);
//     conversation.remove();

//     if (window.conversation_id == conversation_id) {
//         await new_conversation();
//     }

//     await load_conversations(20, 0, true);
// };

// const set_conversation = async (conversation_id) => {
//     history.pushState({}, null, `/chat/${conversation_id}`);
//     window.conversation_id = conversation_id;

//     await clear_conversation();
//     await load_conversation(conversation_id);
//     await load_conversations(20, 0, true);
// };

// // const new_conversation = async () => {
// //     history.pushState({}, null, `/chat/`);
// //     window.conversation_id = uuid();

// //     await clear_conversation();
// //     await load_conversations(20, 0, true);
// // };

// // const load_conversation = async (conversation_id) => {
// //     let conversation = await JSON.parse(
// //         localStorage.getItem(`conversation:${conversation_id}`)
// //     );
// //     console.log(conversation, conversation_id);

// //     for (item of conversation.items) {
// //         message_box.innerHTML += `
// //             <div class="message">
// //                 <div class="user">
// //                     ${item.role == "assistant" ? gpt_image : user_image}
// //                     ${item.role == "assistant"
// //                 ? `<i class="fa-regular fa-phone-arrow-down-left"></i>`
// //                 : `<i class="fa-regular fa-phone-arrow-up-right"></i>`
// //             }
// //                 </div>
// //                 <div class="content">
// //                     ${item.role == "assistant"
// //                 ? markdown.render(item.content)
// //                 : item.content
// //             }
// //                 </div>
// //             </div>
// //         `;
// //     }

// //     document.querySelectorAll(`code`).forEach((el) => {
// //         hljs.highlightElement(el);
// //     });

// //     message_box.scrollTo({ top: message_box.scrollHeight, behavior: "smooth" });

// //     setTimeout(() => {
// //         message_box.scrollTop = message_box.scrollHeight;
// //     }, 500);
// // };

// // const get_conversation = async (conversation_id) => {
// //     let conversation = await JSON.parse(
// //         localStorage.getItem(`conversation:${conversation_id}`)
// //     );
// //     return conversation.items;
// // };

// // const add_conversation = async (conversation_id, title) => {
// //     if (localStorage.getItem(`conversation:${conversation_id}`) == null) {
// //         localStorage.setItem(
// //             `conversation:${conversation_id}`,
// //             JSON.stringify({
// //                 id: conversation_id,
// //                 title: title,
// //                 items: [],
// //             })
// //         );
// //     }
// // };

// // const add_message = async (conversation_id, role, content) => {
// //     before_adding = JSON.parse(
// //         localStorage.getItem(`conversation:${conversation_id}`)
// //     );

// //     before_adding.items.push({
// //         role: role,
// //         content: content,
// //     });

// //     localStorage.setItem(
// //         `conversation:${conversation_id}`,
// //         JSON.stringify(before_adding)
// //     ); // update conversation
// // };

// const load_conversations = async (limit, offset, loader) => {
//     //console.log(loader);
//     //if (loader === undefined) box_conversations.appendChild(spinner);

//     let conversations = [];
//     for (let i = 0; i < localStorage.length; i++) {
//         if (localStorage.key(i).startsWith("conversation:")) {
//             let conversation = localStorage.getItem(localStorage.key(i));
//             conversations.push(JSON.parse(conversation));
//         }
//     }

//     //if (loader === undefined) spinner.parentNode.removeChild(spinner)
//     await clear_conversations();

//     for (conversation of conversations) {
//         box_conversations.innerHTML += `
//     <div class="convo" id="convo-${conversation.id}">
//       <div class="left" onclick="set_conversation('${conversation.id}')">
//           <i class="fa-regular fa-comments"></i>
//           <span class="convo-title">${conversation.title}</span>
//       </div>
//       <i onclick="show_option('${conversation.id}')" class="fa-regular fa-trash" id="conv-${conversation.id}"></i>
//       <i onclick="delete_conversation('${conversation.id}')" class="fa-regular fa-check" id="yes-${conversation.id}" style="display:none;"></i>
//       <i onclick="hide_option('${conversation.id}')" class="fa-regular fa-x" id="not-${conversation.id}" style="display:none;"></i>
//     </div>
//     `;
//     }

//     document.querySelectorAll(`code`).forEach((el) => {
//         hljs.highlightElement(el);
//     });
// };

// document.getElementById(`cancelButton`).addEventListener(`click`, async () => {
//     window.controller.abort();
//     console.log(`aborted ${window.conversation_id}`);
// });

// function h2a(str1) {
//     var hex = str1.toString();
//     var str = "";

//     for (var n = 0; n < hex.length; n += 2) {
//         str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
//     }

//     return str;
// }

// const uuid = () => {
//     return `xxxxxxxx-xxxx-4xxx-yxxx-${Date.now().toString(16)}`.replace(
//         /[xy]/g,
//         function (c) {
//             var r = (Math.random() * 16) | 0,
//                 v = c == "x" ? r : (r & 0x3) | 0x8;
//             return v.toString(16);
//         }
//     );
// };

// const message_id = () => {
//     random_bytes = (Math.floor(Math.random() * 1338377565) + 2956589730).toString(
//         2
//     );
//     unix = Math.floor(Date.now() / 1000).toString(2);

//     return BigInt(`0b${unix}${random_bytes}`).toString();
// };

// window.onload = async () => {
//     load_settings_localstorage();

//     conversations = 0;
//     for (let i = 0; i < localStorage.length; i++) {
//         if (localStorage.key(i).startsWith("conversation:")) {
//             conversations += 1;
//         }
//     }

//     if (conversations == 0) localStorage.clear();

//     await setTimeout(() => {
//         load_conversations(20, 0);
//     }, 1);

//     if (!window.location.href.endsWith(`#`)) {
//         if (/\/chat\/.+/.test(window.location.href)) {
//             await load_conversation(window.conversation_id);
//         }
//     }

//     message_input.addEventListener(`keydown`, async (evt) => {
//         if (prompt_lock) return;
//         if (evt.keyCode === 13 && !evt.shiftKey) {
//             evt.preventDefault();
//             console.log('pressed enter');
//             await handle_ask();
//         } else {
//             message_input.style.removeProperty("height");
//             message_input.style.height = message_input.scrollHeight + 4 + "px";
//         }
//     });



//     register_settings_localstorage();
// };

// document.querySelector(".mobile-sidebar").addEventListener("click", (event) => {
//     const sidebar = document.querySelector(".conversations");

//     if (sidebar.classList.contains("shown")) {
//         sidebar.classList.remove("shown");
//         event.target.classList.remove("rotated");
//     } else {
//         sidebar.classList.add("shown");
//         event.target.classList.add("rotated");
//     }

//     window.scrollTo(0, 0);
// });

// const register_settings_localstorage = async () => {
//     settings_ids = ["switch", "model", "jailbreak"];
//     settings_elements = settings_ids.map((id) => document.getElementById(id));
//     settings_elements.map((element) =>
//         element.addEventListener(`change`, async (event) => {
//             switch (event.target.type) {
//                 case "checkbox":
//                     localStorage.setItem(event.target.id, event.target.checked);
//                     break;
//                 case "select-one":
//                     localStorage.setItem(event.target.id, event.target.selectedIndex);
//                     break;
//                 default:
//                     console.warn("Unresolved element type");
//             }
//         })
//     );
// };

// const load_settings_localstorage = async () => {
//     settings_ids = ["switch", "model", "jailbreak"];
//     settings_elements = settings_ids.map((id) => document.getElementById(id));
//     settings_elements.map((element) => {
//         if (localStorage.getItem(element.id)) {
//             switch (element.type) {
//                 case "checkbox":
//                     element.checked = localStorage.getItem(element.id) === "true";
//                     break;
//                 case "select-one":
//                     element.selectedIndex = parseInt(localStorage.getItem(element.id));
//                     break;
//                 default:
//                     console.warn("Unresolved element type");
//             }
//         }
//     });
// };

// // Theme storage for recurring viewers
// const storeTheme = function (theme) {
//     localStorage.setItem("theme", theme);
// };

// // set theme when visitor returns
// const setTheme = function () {
//     const activeTheme = localStorage.getItem("theme");
//     colorThemes.forEach((themeOption) => {
//         if (themeOption.id === activeTheme) {
//             themeOption.checked = true;
//         }
//     });
//     // fallback for no :has() support
//     document.documentElement.className = activeTheme;
// };

// colorThemes.forEach((themeOption) => {
//     themeOption.addEventListener("click", () => {
//         storeTheme(themeOption.id);
//         // fallback for no :has() support
//         document.documentElement.className = themeOption.id;
//     });
// });

// document.onload = setTheme();
