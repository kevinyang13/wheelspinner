// Reading comprehension passages for reading.html.
//
// The first three stories were written by hand and are kept word for word —
// do not reword them. Every story has a title, the passage, and three to five
// questions. A question may carry a `skill` label (the kind of thinking it
// asks for); the ones without a label simply show no tag.
const STORIES = [
  {
    id: 'maya-box',
    title: 'The Wrapped Box',
    emoji: '🎁',
    minutes: 1,
    text: [
      "Maya tiptoed past the kitchen, holding a brightly wrapped box behind her back. When her dog, Buster, started barking happily, Maya quickly put a finger to her lips and whispered, 'Shhh! Not yet!' She glanced toward the living room where her mom was reading.",
    ],
    questions: [
      {
        q: 'What is Maya doing?',
        a: 'Sneaking past the kitchen with a wrapped present.',
      },
      {
        q: 'Why is she trying to be quiet?',
        a: "She doesn't want her mom in the living room to hear her or see the box.",
      },
      {
        q: 'What is the box probably for?',
        a: 'A surprise gift for her mom—like for her birthday or Mother’s Day—even though the story never said "surprise" or "gift"!',
      },
    ],
  },

  {
    id: 'marcus-volcano',
    title: 'The Missing Science Project',
    emoji: '🌋',
    minutes: 2,
    text: [
      "Marcus woke up with a knot in his stomach because today was the third-grade science fair. All week, he had worked on his model volcano, carefully painting the sides gray and brown and mixing baking soda and red food coloring into a small plastic cup for the lava. Before going to bed last night, he had set the volcano right next to the front door so he wouldn't forget it.",
      "When Marcus walked into the hallway with his backpack, he froze. The spot by the front door was completely empty. His heart sank as he spun around, checking behind the coat rack and under the bench. 'Did Toby knock it over?' Marcus thought, remembering how his little brother loved poking at the clay rocks.",
      "Just then, the kitchen door swung open. Dad walked in holding a wide cardboard box with handles cut into the sides, and inside sat the volcano—completely safe, cushioned by two rolled-up dish towels. 'I figured carrying that bumpy thing on the school bus might end in disaster,' Dad smiled. 'Grab your coat, I'll drive you in early so we can set it up.'",
    ],
    questions: [
      {
        skill: 'Understanding Figurative Language',
        q: 'The story says Marcus woke up with "a knot in his stomach" and later "his heart sank." Did those things really happen to his body, or what do those phrases mean?',
        a: 'They are expressions—a knot in his stomach means he felt nervous/excited, and his heart sank means he suddenly felt really worried or disappointed.',
      },
      {
        skill: 'Changing Guesses (Revising)',
        q: 'At first, who did Marcus blame for the missing volcano, and why did that guess make sense?',
        a: 'He thought his little brother Toby knocked it over, because Toby had been poking at it earlier.',
      },
      {
        skill: 'Character Motivation (Why?)',
        q: 'Why did Dad put the volcano in a cardboard box with dish towels?',
        a: "To protect it so it wouldn't break or tip over on the bumpy school bus.",
      },
      {
        skill: 'Summary (Big Picture)',
        q: 'Can you tell what happened in this story using just two sentences?',
        a: 'Example: Marcus thought his science fair volcano was missing or broken by his little brother. Instead, he found out his dad had safely packed it in a box to drive him to school.',
      },
    ],
  },

  {
    id: 'nora-trail',
    title: 'The Midnight Trail',
    emoji: '🦉',
    minutes: 2,
    text: [
      "Nora zipped up her jacket as the evening air turned chilly at Pine Ridge Campground. Her older cousin, Liam, had promised to take her on the lantern trail to see the owls—if she could prove she knew how to use a compass. Nora held the small round gadget flat in her palm, watching the red needle wiggle until it lined up with the letter N. 'North is behind the ranger station,' she announced proudly.",
      "Liam grinned and handed her a flashlight, and they stepped onto the dirt path just as the sun dipped below the trees. After ten minutes of crunching over pine needles, they reached a fork in the trail where a wooden signpost had fallen flat into the weeds. Both arrows were covered in mud, and the woods were growing darker by the second. Nora bit her lip, remembering the trail map she had studied back at camp.",
      "She pulled out her compass again, turned slowly until she faced east, and pointed toward the narrower path on the right. 'The owl lookout is toward the sunrise,' she said, wiping a smudge of dirt off the fallen sign to double-check. Beneath the mud, a faint painted arrow pointed right. Liam let out a low whistle and clicked on his lantern. 'Lead the way, navigator.'",
    ],
    questions: [
      {
        skill: 'Cause and Effect (The Deal)',
        q: 'What did Nora have to do before Liam would take her on the night hike?',
        a: 'She had to prove she knew how to use a compass.',
      },
      {
        skill: 'Problem Solving (Connecting Clues)',
        q: 'When the wooden signpost fell down and got covered in mud, how did Nora figure out which way to go?',
        a: 'She remembered from the camp map that the owl lookout was east—toward the sunrise—and used her compass to find east.',
      },
      {
        skill: 'Vocabulary in Context',
        q: 'At the very end, Liam calls Nora "navigator." Based on what Nora just did in the story, what do you think a navigator is?',
        a: 'Someone who figures out directions and guides the way on a trip.',
      },
      {
        skill: 'Character Change',
        q: "How did Liam's attitude toward Nora change from the beginning of the story to the end?",
        a: 'At first, he was testing her to see if she was ready; by the end, he was impressed and trusted her to lead the hike.',
      },
    ],
  },

  // ───────────────────────── new stories ─────────────────────────

  {
    id: 'priya-bus',
    title: 'The Last Seat on the Bus',
    emoji: '🚌',
    minutes: 2,
    text: [
      "Priya always sat in the fourth row of bus 12, right by the window, with her backpack parked on the seat beside her like a sleepy passenger. That seat was hers. Everybody knew it, and nobody argued, because Priya had ridden bus 12 since kindergarten.",
      "On Tuesday a new boy climbed the steps. His sweatshirt still had a crease down the middle from the package, and he held his lunchbox with both hands. He walked halfway down the aisle, stopped, and looked at the rows of elbows and knees. Every seat had somebody in it. The bus driver called, 'Find a spot, please!' and the brakes hissed. The boy's ears turned pink.",
      "Priya looked at her backpack. She looked at the boy. Then she swung the backpack onto her lap, scooted toward the window, and patted the empty stretch of green vinyl. 'It's squeaky,' she warned him, 'but it's the best window on the bus.' The boy sat down so fast he nearly dropped his lunchbox. By the time they passed the fire station, he had told her his name was Arjun, that he'd moved from Ohio on Saturday, and that he was scared of exactly one thing: the cafeteria.",
    ],
    questions: [
      {
        skill: 'Reading the Clues (Inference)',
        q: 'The story never says the boy was new to the school. What clues tell you he was?',
        a: "The crease still in his sweatshirt, the way he held his lunchbox with both hands, not knowing where to sit, and later saying he had moved from Ohio on Saturday.",
      },
      {
        skill: 'Understanding Feelings',
        q: 'What does it mean that "the boy’s ears turned pink"?',
        a: 'He was embarrassed or nervous standing there with everyone watching and nowhere to sit.',
      },
      {
        skill: 'Character Motivation (Why?)',
        q: 'Priya had kept that seat to herself for years. Why do you think she moved her backpack this time?',
        a: 'She noticed he had nowhere to go and felt bad for him—being kind mattered more to her than keeping the seat.',
      },
      {
        skill: 'Predicting',
        q: 'Arjun says he is scared of exactly one thing: the cafeteria. What do you think Priya might do at lunchtime?',
        a: 'Likely invite him to sit with her or show him where to go—she already made room for him once.',
      },
    ],
  },

  {
    id: 'theo-lemonade',
    title: 'The Lemonade Experiment',
    emoji: '🍋',
    minutes: 2,
    text: [
      "Theo's lemonade stand made eleven dollars on Saturday, which he counted three times on the driveway. On Sunday he made two dollars. Same lemons, same pitcher, same hand-lettered sign. He slumped onto the curb and announced that the neighborhood had simply run out of thirsty people.",
      "His sister Daniela sat down next to him with her notebook. 'Tell me everything that was different,' she said. Theo thought. The sign was the same. The price was the same. Then he remembered: on Sunday the sun had been blazing on the driveway, so he had dragged the whole stand around to the shady side of the house, where it was much more comfortable.",
      "Daniela flipped her notebook around and drew two little maps. 'Saturday,' she said, tapping the first one, 'you were here—where the sidewalk is.' She tapped the second. 'Sunday you were behind the hedge.' Theo stared at the drawings. Then he stood up, grabbed one end of the table, and said, 'Help me move it back. I'll wear a hat.'",
    ],
    questions: [
      {
        skill: 'Cause and Effect',
        q: 'Why did Theo sell so much less lemonade on Sunday?',
        a: 'He had moved the stand behind the hedge into the shade, so people walking by on the sidewalk could not see it anymore.',
      },
      {
        skill: 'Changing Guesses (Revising)',
        q: 'What was Theo’s first explanation, and why was it wrong?',
        a: 'He decided the neighborhood had run out of thirsty people. It was wrong because the customers were still there—they just could not see his stand.',
      },
      {
        skill: 'Problem Solving',
        q: 'How did Daniela help him figure it out without telling him the answer?',
        a: 'She asked what was different between the two days and drew maps of where the stand sat, so he could see it himself.',
      },
      {
        skill: 'Reading the Clues (Inference)',
        q: 'At the end Theo says, "I’ll wear a hat." What has he decided?',
        a: 'To move the stand back into the sunny spot by the sidewalk and put up with the heat, because being seen matters more than being comfortable.',
      },
    ],
  },

  {
    id: 'ana-recipe',
    title: "Grandma's Recipe Card",
    emoji: '🍪',
    minutes: 2,
    text: [
      "The recipe card was the color of weak tea and soft at the corners, like cloth. Ana found it tucked in the back of the kitchen drawer, under the rubber bands and the batteries nobody trusted. At the top, in handwriting that leaned hard to the right, it said: Abuela’s Polvorones. Below that came flour, butter, sugar, cinnamon—and then, on the last line, a pinch of patience.",
      "Ana measured everything twice. She creamed the butter and sugar, worked in the flour, and rolled the dough into little moons. Then she opened the cupboard and hunted for a jar labeled patience. There was oregano. There was paprika. There was a very old jar of sprinkles. She turned around with her hands on her hips.",
      "Her father looked up from the sink, flour on his glasses, and started laughing—not at her, exactly. 'Your great-grandmother wrote that card,' he said. 'She used to say the dough tastes better if you let it rest cold in the refrigerator for an hour instead of baking it right away.' Ana looked at the tray of little moons. One hour. She covered them, slid them onto the shelf, and set the kitchen timer. Then she turned the card over. On the back, in the same slanted writing: Don’t skip the hour. I know you want to.",
    ],
    questions: [
      {
        skill: 'Understanding Figurative Language',
        q: 'What does "a pinch of patience" on the recipe card really mean?',
        a: 'It is not an ingredient—it means you have to wait, in this case letting the dough rest in the refrigerator for an hour.',
      },
      {
        skill: 'Vocabulary in Context',
        q: 'The card is described as "the color of weak tea and soft at the corners, like cloth." What does that tell you about the card?',
        a: 'That it is very old—yellowed with age and worn soft from being handled many times.',
      },
      {
        skill: 'Reading the Clues (Inference)',
        q: 'Who wrote the note on the back of the card, and who do you think it was written for?',
        a: "Ana's great-grandmother wrote it, for whoever makes the cookies next—someone impatient, which is why she added “I know you want to.”",
      },
      {
        skill: 'Character Motivation (Why?)',
        q: 'Why did Ana’s father laugh, and why does the story say he was not laughing at her, exactly?',
        a: 'He found her search for a jar of patience funny, but he was not being mean—he recognized a family joke his own grandmother used to make.',
      },
      {
        skill: 'Summary (Big Picture)',
        q: 'Can you tell this story in two sentences?',
        a: 'Example: Ana found her great-grandmother’s old cookie recipe that listed "a pinch of patience" and went looking for it in the cupboard. Her dad explained it meant letting the dough rest for an hour, and she put the cookies in the refrigerator to wait.',
      },
    ],
  },

  {
    id: 'sam-treehouse',
    title: 'The Treehouse Plan',
    emoji: '🪜',
    minutes: 2,
    text: [
      "Sam and Jo had drawn the treehouse on graph paper for eleven days. The floor would be a square, four feet on every side, wedged into the fork of the old maple. They had the nails. They had Jo's uncle's saw and permission to use it with an adult standing right there. What they had was five boards, each exactly three feet long.",
      "Jo held a board up against the fork of the tree and frowned. It stopped a whole foot short of the far branch. 'We need four-foot boards,' she said. 'We have three-foot boards. The store is closed until Monday.' Sam laid the boards on the grass in a row and stared at them until his eyes went blurry.",
      "Then he picked up two boards and laid them side by side, long ways, overlapping in the middle like two hands with laced fingers. Together they stretched well past four feet. 'We nail them to a crosspiece underneath,' he said, 'and cut off whatever hangs over.' Jo tilted her head. Then she got the pencil and started redrawing the floor on the graph paper, with a fat line down the middle where the two boards would meet.",
    ],
    questions: [
      {
        skill: 'Problem and Solution',
        q: "What exactly was Sam and Jo's problem?",
        a: 'The treehouse floor needed to span four feet, but every board they had was only three feet long, and the store was closed.',
      },
      {
        skill: 'Problem Solving (Connecting Clues)',
        q: 'How did Sam solve it?',
        a: 'By overlapping two boards end to end and nailing them to a crosspiece underneath, then trimming the extra—making one long board out of two short ones.',
      },
      {
        skill: 'Understanding Figurative Language',
        q: 'The story says the two boards overlapped "like two hands with laced fingers." What picture does that put in your head?',
        a: 'The boards sliding past each other and gripping in the middle instead of just touching end to end—joined and stronger where they meet.',
      },
      {
        skill: 'Character Change',
        q: 'How can you tell Jo thought the idea would work, even though she never says so?',
        a: 'She stopped arguing, tilted her head to think it over, and went straight to redrawing the plan with the new seam in it.',
      },
    ],
  },

  {
    id: 'pickle-hamster',
    title: 'The Case of the Empty Cage',
    emoji: '🐹',
    minutes: 2,
    text: [
      "Room 3B arrived on Thursday morning to find the door of Pickle's cage standing open and no hamster inside. Ms. Rivera asked everyone to walk, not run, and to look with their eyes before their hands. Twenty-two third graders began the slowest search in the history of the school.",
      "Dev found the first clue: a single sunflower seed on the carpet by the bookshelf. Then Harper found another one near the radiator, and a third by the leg of the art cart. Ms. Rivera crouched down and looked along the floor the way you look down a long hallway. 'Seeds in a line,' she said. 'Which way is the line going?'",
      "The children followed the seeds to the corner where the beanbag chairs were stacked, and there, under the bottom beanbag, was a small gray lump breathing fast. Pickle had packed his cheeks for the trip. Later, Ms. Rivera held up the cage door and showed them the latch—bent just enough that it no longer caught. 'Nobody left it open,' she said. 'It has been getting looser for weeks and we did not notice.'",
    ],
    questions: [
      {
        skill: 'Problem Solving (Connecting Clues)',
        q: 'How did the class figure out where Pickle had gone?',
        a: 'They followed the trail of dropped sunflower seeds, which pointed toward the corner with the beanbag chairs.',
      },
      {
        skill: 'Reading the Clues (Inference)',
        q: 'Why was Pickle dropping sunflower seeds as he went?',
        a: 'He had stuffed his cheeks full of food before escaping, and a few seeds fell out as he traveled.',
      },
      {
        skill: 'Changing Guesses (Revising)',
        q: 'An open cage door makes it look like somebody forgot to close it. What really happened?',
        a: 'The latch had slowly bent out of shape over weeks until it stopped catching, so the door opened on its own.',
      },
      {
        skill: 'Character Motivation (Why?)',
        q: 'Why did Ms. Rivera tell the class to "look with their eyes before their hands"?',
        a: 'So twenty-two children grabbing and moving things would not scare Pickle deeper into hiding or hurt him by accident.',
      },
      {
        skill: 'Summary (Big Picture)',
        q: 'Can you tell this story in two sentences?',
        a: 'Example: The class hamster escaped through a cage door that had quietly stopped latching. The students followed a trail of dropped sunflower seeds and found him hiding under the beanbag chairs.',
      },
    ],
  },
];
