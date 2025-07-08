const supabaseClient = supabase.createClient(
  'https://esqftaptriwobfvmigss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcWZ0YXB0cml3b2Jmdm1pZ3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODM0NjgsImV4cCI6MjA2NzU1OTQ2OH0.4_NM6dUsetWa8qF1kC7g8pfxHHK2eQYHCKn1GRDozwQ'
);

let allGrounds = [];
let voteCounts = {};

// this one loads all the grounds + votes and kicks off themain page rendering
async function loadGrounds() {
  const { data, error } = await supabaseClient.from('grounds').select('*');
  if (error) return console.error("Failed to load grounds", error);

  allGrounds = data;
  renderGrounds(data);
}


// this makes the cards and puts them on the page when they have been fetched
function renderGrounds(grounds) {
  const container = document.getElementById('grounds');
  container.innerHTML = '';

  grounds.forEach(ground => {
    const li = document.createElement('li');
    li.className = 'card';

    const count = voteCounts[ground.id] || 0;

    li.innerHTML = `
        <h3>${ground.name}</h3>
      <iframe src="${ground.map_embed_url}" loading="lazy" allowfullscreen></iframe>
      <p>${ground.description}</p>
      </br>

      <div class="badges">
        <span class="badge">🎟️ ${ground.price_range}</span>
        <span class="badge">💷 £${ground.estimated_average}</span>
        <span class="badge">📍 ${ground.location}</span>
      </div>

      <button class="vote-btn" data-id="${ground.id}">
        👍 Upvote (<span id="vote-${ground.id}">${count}</span>)
      </button>
    `;

    container.appendChild(li);
  });

  // this handles when someone clicks to vote
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      await supabaseClient.from('votes').insert([{ ground_id: id }]);
      voteCounts[id] = (voteCounts[id] || 0) + 1;
      document.getElementById(`vote-${id}`).textContent = voteCounts[id];
    });
  });
}

// ========== Feedback ==========

// fetches and shows the feedback cards
async function loadFeedback() {
  const { data, error } = await supabaseClient
    .from('feedback')
    .select('*')
    .order('submitted_at', { ascending: false });

  const container = document.getElementById('feedbackList');
  container.innerHTML = '';

  // comment form card goes first
  const formCard = document.createElement('div');
  formCard.className = 'feedback-card';
  formCard.innerHTML = `
    <h4>Leave a Comment</h4>
    <input type="text" id="name" placeholder="Your name" />
    <input type="email" id="email" placeholder="Email" />
    <select id="rating">
      <option value="5">★★★★★</option>
      <option value="4">★★★★☆</option>
      <option value="3">★★★☆☆</option>
      <option value="2">★★☆☆☆</option>
      <option value="1">★☆☆☆☆</option>
    </select>
    <textarea id="comments" placeholder="Your feedback"></textarea>
    <button onclick="submitFeedback()">Submit</button>
  `;
  container.appendChild(formCard);

  // now the rest of the actual feedback entries
  data.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'feedback-card';
    card.innerHTML = `
      <h4>${entry.name}</h4>
      <div class="stars">${renderStars(entry.rating)}</div>
      <p>${entry.comments}</p>
    `;
    container.appendChild(card);
  });
}

// sends the new feedback to supabase when someone fills out the card form
async function submitFeedback() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const rating = parseInt(document.getElementById('rating').value);
  const comments = document.getElementById('comments').value;

  if (!name || !email || !rating) return alert("Please fill all fields");

  const { error } = await supabaseClient
    .from('feedback')
    .insert([{ name, email, rating, comments }]);

  if (error) {
    alert("Error submitting feedback.");
  } else {
    alert("Thanks for your feedback!");
    loadFeedback(); // refresh comments after submitting
  }
}

// A helper to convert number to stars
function renderStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}


document.addEventListener("DOMContentLoaded", () => {
  
  loadGrounds();
  loadFeedback();
});