/**
 * ARCHÉ — Quiz Culture Parisienne
 *
 * Ignition only: dopamine autorisée ici.
 * Aucune pression de complétion, aucun streak, aucun score public.
 *
 * L'excitation existe au seuil, jamais dans le territoire.
 */

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  echo: string; // La résonance poétique — la graine plantée
  level: 1 | 2 | 3 | 4 | 5;
  category: string;
  hint: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "Q001",
    question: "How many arrondissements does Paris have?",
    choices: ["A. 18", "B. 20", "C. 16", "D. 22"],
    answer: "B",
    explanation: "Paris has been divided into 20 municipal arrondissements since 1860, numbered in a spiral from the center.",
    echo: "Paris reads like a spiral. A city that turns around its heart.",
    level: 1,
    category: "Repères",
    hint: "In 1860, Paris went from 12 to 20 arrondissements."
  },
  {
    id: "Q002",
    question: "Which river runs through Paris?",
    choices: ["A. The Loire", "B. The Seine", "C. The Rhône", "D. The Garonne"],
    answer: "B",
    explanation: "The Seine runs through Paris from east to west for about 13 km. Its course cuts the city into two banks.",
    echo: "The city is not set upon the water. It is split by a memory that flows.",
    level: 1,
    category: "Origines",
    hint: "It gave its name to the départements of the inner suburbs."
  },
  {
    id: "Q003",
    question: "Which metal tower is the symbol of Paris?",
    choices: ["A. Tour Montparnasse", "B. Eiffel Tower", "C. Tower of London", "D. Leaning Tower of Pisa"],
    answer: "B",
    explanation: "The Eiffel Tower was built for the 1889 World's Fair. It now stands about 324 m tall with its antennas.",
    echo: "A skeleton of iron become an inner landmark.",
    level: 1,
    category: "Belle Époque",
    hint: "World's Fair of 1889."
  },
  {
    id: "Q004",
    question: "Which museum houses the Mona Lisa?",
    choices: ["A. Musée d'Orsay", "B. Louvre Museum", "C. Centre Pompidou", "D. Musée Rodin"],
    answer: "B",
    explanation: "The Mona Lisa is on display at the Louvre, a former royal palace turned national museum.",
    echo: "Before it was a museum, it was a palace. The place is the first work.",
    level: 1,
    category: "Art & Lettres",
    hint: "Paris's largest museum."
  },
  {
    id: "Q005",
    question: "Which famous Gothic cathedral stands on the Île de la Cité in Paris?",
    choices: ["A. Notre-Dame de Paris", "B. Basilica of Saint-Denis", "C. Basilica of the Sacré-Cœur", "D. Saint-Paul Church"],
    answer: "A",
    explanation: "Notre-Dame de Paris, begun in the 12th century, is a major monument of Gothic art on the Île de la Cité.",
    echo: "A stone that has prayed for centuries, even when belief fades.",
    level: 1,
    category: "Moyen Âge",
    hint: "A novel by Victor Hugo bears its name."
  },
  {
    id: "Q006",
    question: "Which religious monument with a white dome overlooks the hill of Montmartre?",
    choices: ["A. Notre-Dame Cathedral", "B. Basilica of the Sacré-Cœur", "C. Saint-Sulpice Church", "D. The Panthéon"],
    answer: "B",
    explanation: "The Basilica of the Sacré-Cœur overlooks Montmartre. Its pale dome is visible from afar.",
    echo: "A white summit: the city looks at itself from its own height.",
    level: 1,
    category: "Belle Époque",
    hint: "Montmartre, white dome, panorama."
  },
  {
    id: "Q007",
    question: "Which major Paris avenue links the Arc de Triomphe to the Place de la Concorde?",
    choices: ["A. Avenue des Champs-Élysées", "B. Avenue Montaigne", "C. Boulevard Saint-Germain", "D. Rue de Rivoli"],
    answer: "A",
    explanation: "The Champs-Élysées runs between the Concorde and the Arc de Triomphe, a major axis for ceremonies and parades.",
    echo: "A corridor of power disguised as a promenade.",
    level: 1,
    category: "XIXe siècle",
    hint: "The great July 14 parade passes there."
  },
  {
    id: "Q008",
    question: "Which nickname refers to Paris for its intellectual influence and its lights?",
    choices: ["A. City of Light", "B. Eternal City", "C. City of Angels", "D. Venice of the North"],
    answer: "A",
    explanation: "« City of Light » evokes both the Paris of the Enlightenment and the rise of urban lighting, as well as its cultural influence.",
    echo: "Light here is not a backdrop. It is an idea.",
    level: 1,
    category: "Art & Lettres",
    hint: "A nickname linked to the Enlightenment and to lighting."
  },
  {
    id: "Q009",
    question: "In which year did the Storming of the Bastille take place, the symbolic start of the French Revolution?",
    choices: ["A. 1776", "B. 1789", "C. 1792", "D. 1815"],
    answer: "B",
    explanation: "The Storming of the Bastille took place on July 14, 1789. The event became a founding symbol.",
    echo: "A wall falls, and the whole century becomes unstable.",
    level: 1,
    category: "Révolution",
    hint: "A July 14."
  },
  {
    id: "Q010",
    question: "Which prison-fortress was stormed on July 14, 1789?",
    choices: ["A. The Conciergerie", "B. The Bastille", "C. The Temple", "D. The Hôtel-Dieu"],
    answer: "B",
    explanation: "The Bastille was a fortress that had become a state prison. Its fall symbolizes the challenge to absolute authority.",
    echo: "A place becomes a sign. And the sign becomes a date.",
    level: 1,
    category: "Révolution",
    hint: "On the site of the current Place de la Bastille."
  },
  {
    id: "Q011",
    question: "Which king of France was reigning at the time of the 1789 Revolution?",
    choices: ["A. Louis XIV", "B. Louis XV", "C. Louis XVI", "D. Napoleon I"],
    answer: "C",
    explanation: "Louis XVI was reigning in 1789. He was executed in 1793 in Paris.",
    echo: "A reign ends when the city no longer recognizes the crown.",
    level: 1,
    category: "Révolution",
    hint: "Husband of Marie-Antoinette."
  },
  {
    id: "Q012",
    question: "Which execution device became a symbol of the French Revolution?",
    choices: ["A. The gallows", "B. The guillotine", "C. The electric chair", "D. The stake"],
    answer: "B",
    explanation: "The guillotine, adopted during the Revolution, is associated with the Terror. It was conceived as an « egalitarian » instrument.",
    echo: "When equality becomes a machine, the age turns sharp.",
    level: 1,
    category: "Révolution",
    hint: "« National razor »."
  },
  {
    id: "Q013",
    question: "Which Paris cabaret is symbolized by a large red windmill?",
    choices: ["A. Le Lido", "B. Crazy Horse", "C. Moulin Rouge", "D. Folies Bergère"],
    answer: "C",
    explanation: "The Moulin Rouge, founded in 1889 in Pigalle, is a famous cabaret of Paris nightlife.",
    echo: "A Paris night: sometimes truer than the day.",
    level: 1,
    category: "Belle Époque",
    hint: "Pigalle, 1889, Toulouse-Lautrec posters."
  },
  {
    id: "Q014",
    question: "In which Paris monument is Napoleon I buried?",
    choices: ["A. The Panthéon", "B. Les Invalides", "C. Basilica of Saint-Denis", "D. Notre-Dame de Paris"],
    answer: "B",
    explanation: "Napoleon I's tomb is at Les Invalides, under the gilded dome.",
    echo: "An empire shrinks to a circle of stone, at the center of silence.",
    level: 1,
    category: "XIXe siècle",
    hint: "Large dome covered in gold."
  },
  {
    id: "Q015",
    question: "Which 210-meter skyscraper, built in 1973, is the only one of its kind within Paris proper?",
    choices: ["A. The Eiffel Tower", "B. Tour Montparnasse", "C. Tour Saint-Jacques", "D. Tour First"],
    answer: "B",
    explanation: "Tour Montparnasse, completed in 1973, rises to about 210 m and remains an exception in central Paris.",
    echo: "A verticality that reminds you a city chooses its limits.",
    level: 1,
    category: "XXe siècle",
    hint: "Near Gare Montparnasse."
  },
  {
    id: "Q016",
    question: "Which business district is known for its skyscrapers and the Grande Arche?",
    choices: ["A. La Villette", "B. La Défense", "C. Bercy", "D. Montorgueil"],
    answer: "B",
    explanation: "La Défense is a major business district west of Paris, marked by the Grande Arche inaugurated in 1989.",
    echo: "Where the city becomes a diagram.",
    level: 1,
    category: "XXe siècle",
    hint: "Aligned with the Arc de Triomphe."
  },
  {
    id: "Q017",
    question: "In which year was Paris liberated from Nazi occupation?",
    choices: ["A. 1940", "B. 1944", "C. 1945", "D. 1939"],
    answer: "B",
    explanation: "Paris was liberated on August 25, 1944, after four years of German occupation.",
    echo: "A city frees itself from its fear too.",
    level: 1,
    category: "XXe siècle",
    hint: "August 25."
  },
  {
    id: "Q018",
    question: "What happened in Paris in May 1968?",
    choices: ["A. A student revolt and a general strike", "B. A World's Fair", "C. The Summer Olympics", "D. The inauguration of the Paris métro"],
    answer: "A",
    explanation: "May 1968 saw student protests and a major strike, durably transforming social and political life.",
    echo: "When the walls speak, the city becomes a tribune.",
    level: 1,
    category: "XXe siècle",
    hint: "Barricades in the Latin Quarter."
  },
  {
    id: "Q019",
    question: "Which is the largest cemetery in Paris, known for its celebrity graves?",
    choices: ["A. Montmartre", "B. Père-Lachaise", "C. Montparnasse", "D. Passy"],
    answer: "B",
    explanation: "Père-Lachaise (1804) is the largest cemetery within Paris and one of the most visited.",
    echo: "In Paris, even death has an address.",
    level: 1,
    category: "Paris Secret",
    hint: "In the 20th arrondissement."
  },
  {
    id: "Q020",
    question: "What are the tourist boats that sail on the Seine called?",
    choices: ["A. Bateaux-Mouches", "B. Batobus", "C. Gondolas", "D. Barges"],
    answer: "A",
    explanation: "The Bateaux-Mouches offer cruises on the Seine to see Paris from the river.",
    echo: "A city can also be understood at water level.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Departure often near the Pont de l'Alma."
  },
  {
    id: "Q021",
    question: "Which simple sandwich is made of a baguette, butter, and ham?",
    choices: ["A. Jambon-beurre", "B. Croque-monsieur", "C. Pan bagnat", "D. Hot dog"],
    answer: "A",
    explanation: "The jambon-beurre is a Parisian classic: half baguette, butter, ham.",
    echo: "In Paris, simplicity can be a signature.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Found in almost every bakery."
  },
  {
    id: "Q022",
    question: "Which traditional dish of onions topped with melted cheese is associated with the nights of Les Halles?",
    choices: ["A. French onion soup", "B. Pot-au-feu", "C. Bouillabaisse", "D. Gratin dauphinois"],
    answer: "A",
    explanation: "French onion soup was served late at night, especially around the old Les Halles market.",
    echo: "A city ends the night with a warm bowl and noise in the streets.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Onions + gratin + bread."
  },
  {
    id: "Q023",
    question: "Which small round pastry, popularized by Ladurée, is a Parisian specialty?",
    choices: ["A. Macaron", "B. Madeleine", "C. Croissant", "D. Éclair"],
    answer: "A",
    explanation: "The Parisian macaron is a filled meringue shell, made in many flavors.",
    echo: "A tiny sweetness that holds a ritual.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Often sold in multicolored boxes."
  },
  {
    id: "Q024",
    question: "Which dance is associated with Paris cabarets like the Moulin Rouge?",
    choices: ["A. French cancan", "B. Charleston", "C. Waltz", "D. Tango"],
    answer: "A",
    explanation: "The French cancan, famous in the Belle Époque, is an energetic cabaret dance.",
    echo: "When the city dances, it forgets its rules for a moment.",
    level: 1,
    category: "Belle Époque",
    hint: "Dance with high kicks."
  },
  {
    id: "Q025",
    question: "Which Saint-Germain-des-Prés café is associated with Sartre and Beauvoir?",
    choices: ["A. Les Deux Magots", "B. Café de Flore", "C. Le Procope", "D. La Coupole"],
    answer: "A",
    explanation: "Les Deux Magots, in Saint-Germain-des-Prés, is an emblematic place of Parisian literary and intellectual life.",
    echo: "A café can become a workshop of ideas.",
    level: 1,
    category: "Art & Lettres",
    hint: "Facing the Saint-Germain-des-Prés church."
  },
  {
    id: "Q026",
    question: "Which date commemorates the Storming of the Bastille and is celebrated as the national holiday?",
    choices: ["A. July 14", "B. January 1", "C. November 11", "D. August 4"],
    answer: "A",
    explanation: "July 14 is the French national holiday, associated with 1789 and republican celebrations.",
    echo: "A date becomes a collective rhythm.",
    level: 1,
    category: "Révolution",
    hint: "People often say simply « the 14th of July »."
  },
  {
    id: "Q027",
    question: "Which king, nicknamed the « Sun King », reigned for a very long time and shaped the classical age?",
    choices: ["A. Francis I", "B. Louis XIV", "C. Henry IV", "D. Louis XVI"],
    answer: "B",
    explanation: "Louis XIV reigned from 1643 to 1715. He embodies absolute monarchy and the classical age.",
    echo: "A reign so long it bends architecture to its duration.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "1643–1715."
  },
  {
    id: "Q028",
    question: "Which writer wrote « Les Misérables » and « Notre-Dame de Paris »?",
    choices: ["A. Alexandre Dumas", "B. Victor Hugo", "C. Émile Zola", "D. Gustave Flaubert"],
    answer: "B",
    explanation: "Victor Hugo wrote « Notre-Dame de Paris » (1831) and « Les Misérables » (1862), two works tied to Paris.",
    echo: "Sometimes a city becomes a character.",
    level: 1,
    category: "Art & Lettres",
    hint: "Great Romantic author of the 19th century."
  },
  {
    id: "Q029",
    question: "Which singer, nicknamed « la Môme Piaf », sang « La Vie en rose »?",
    choices: ["A. Dalida", "B. Édith Piaf", "C. Barbara", "D. Juliette Gréco"],
    answer: "B",
    explanation: "Édith Piaf is a major figure of French song, associated with Paris and its mythologies.",
    echo: "Sometimes a single voice is enough to make a city.",
    level: 1,
    category: "Art & Lettres",
    hint: "« Piaf » means « sparrow » in slang."
  },
  {
    id: "Q030",
    question: "Which Spanish painter, author of « Guernica », lived in Paris for a long time?",
    choices: ["A. Pablo Picasso", "B. Salvador Dalí", "C. Francisco Goya", "D. Joan Miró"],
    answer: "A",
    explanation: "Pablo Picasso lived and worked in Paris, especially in the early 20th century, in Montmartre then Montparnasse.",
    echo: "Paris is not only monuments. It attracts forces.",
    level: 1,
    category: "Art & Lettres",
    hint: "Bateau-Lavoir, Montmartre."
  },
  {
    id: "Q031",
    question: "Which Paris art museum is housed in a former train station and celebrates Impressionism?",
    choices: ["A. Louvre", "B. Musée d'Orsay", "C. Centre Pompidou", "D. Orangerie"],
    answer: "B",
    explanation: "The Musée d'Orsay occupies the former Gare d'Orsay and holds major 19th-century collections (Impressionism, etc.).",
    echo: "A station frozen in time to let other journeys pass through.",
    level: 1,
    category: "Art & Lettres",
    hint: "Former station built for 1900."
  },
  {
    id: "Q032",
    question: "Which wood to the west of Paris is known for its lakes and gardens?",
    choices: ["A. Bois de Vincennes", "B. Buttes-Chaumont", "C. Bois de Boulogne", "D. Fontainebleau"],
    answer: "C",
    explanation: "The Bois de Boulogne is a vast green space west of Paris, with lakes, paths, and gardens.",
    echo: "The city keeps a wild edge, like a breath.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Near the 16th arrondissement."
  },
  {
    id: "Q033",
    question: "Which wood to the east of Paris is home to the Parc Floral and Lac Daumesnil?",
    choices: ["A. Bois de Boulogne", "B. Parc Montsouris", "C. Bois de Vincennes", "D. Parc de Belleville"],
    answer: "C",
    explanation: "The Bois de Vincennes is a large green space east of Paris, with the Parc Floral and Lac Daumesnil.",
    echo: "Two woods: two green gates to leave without leaving the city.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Southeast of Paris."
  },
  {
    id: "Q034",
    question: "What is the approximate population of Paris proper (intra-muros)?",
    choices: ["A. About 2.2 million", "B. About 10 million", "C. About 500,000", "D. About 8 million"],
    answer: "A",
    explanation: "Paris proper has a little over 2 million inhabitants. The greater urban area is much larger.",
    echo: "A density: not just people, but layered stories.",
    level: 1,
    category: "Repères",
    hint: "The greater metropolis far exceeds Paris proper."
  },
  {
    id: "Q035",
    question: "Where does the President of the Republic officially reside in Paris?",
    choices: ["A. Palais Bourbon", "B. Hôtel de Ville", "C. Matignon", "D. Élysée"],
    answer: "D",
    explanation: "The official residence of the President of the Republic is the Élysée Palace (rue du Faubourg-Saint-Honoré).",
    echo: "Power has an address. So does the city.",
    level: 1,
    category: "Repères",
    hint: "Presidency ≠ Government (Matignon)."
  },
  {
    id: "Q036",
    question: "In which arrondissement is the Eiffel Tower located?",
    choices: ["A. 5th", "B. 7th", "C. 18th", "D. 1st"],
    answer: "B",
    explanation: "The Eiffel Tower is in the 7th arrondissement, near the Champ-de-Mars.",
    echo: "A global landmark, a very precise address.",
    level: 1,
    category: "Repères",
    hint: "Left bank, near Les Invalides."
  },
  {
    id: "Q037",
    question: "In which arrondissement are Montmartre and the Sacré-Cœur located?",
    choices: ["A. 18th", "B. 5th", "C. 12th", "D. 7th"],
    answer: "A",
    explanation: "Montmartre and the Basilica of the Sacré-Cœur are in the 18th arrondissement.",
    echo: "A village above the city, still there.",
    level: 1,
    category: "Repères",
    hint: "North of Paris."
  },
  {
    id: "Q038",
    question: "In which arrondissement is the Louvre Museum located?",
    choices: ["A. 1st", "B. 4th", "C. 7th", "D. 6th"],
    answer: "A",
    explanation: "The Louvre is in the 1st arrondissement, at the heart of Paris, near the Tuileries.",
    echo: "The center is not a point. It is a density.",
    level: 1,
    category: "Repères",
    hint: "Next to the Tuileries Garden."
  },
  {
    id: "Q039",
    question: "In which arrondissement is Notre-Dame (Île de la Cité) located?",
    choices: ["A. 4th", "B. 1st", "C. 5th", "D. 7th"],
    answer: "A",
    explanation: "Notre-Dame is in the 4th arrondissement, on the Île de la Cité.",
    echo: "In the middle of the water, a stone that makes a center.",
    level: 1,
    category: "Repères",
    hint: "Île de la Cité."
  },
  {
    id: "Q040",
    question: "Which Egyptian monument stands at the center of the Place de la Concorde?",
    choices: ["A. Statue of Ramses", "B. Rosetta Stone", "C. Luxor Obelisk", "D. Pyramid of Khufu"],
    answer: "C",
    explanation: "The Luxor Obelisk, gifted in the 19th century, has stood in the Place de la Concorde since 1836.",
    echo: "A fragment of Egypt set in the axis of Paris.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Installed in 1836."
  },
  {
    id: "Q041",
    question: "Which large garden between the Louvre and the Place de la Concorde was linked to the Tuileries Palace?",
    choices: ["A. Jardin des Tuileries", "B. Jardin du Luxembourg", "C. Parc Monceau", "D. Parc Montsouris"],
    answer: "A",
    explanation: "The Tuileries Garden was laid out in the 16th century and lies between the Louvre and the Place de la Concorde.",
    echo: "Between two stones of power, the walk becomes calm.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "It runs along the Rue de Rivoli and its ponds are famous."
  },
  {
    id: "Q042",
    question: "Which flea market, just outside Paris, is associated with Saint-Ouen?",
    choices: ["A. Marché d'Aligre", "B. Puces de Saint-Ouen", "C. Marché des Enfants Rouges", "D. Marché Raspail"],
    answer: "B",
    explanation: "The Puces de Saint-Ouen are a vast set of antiques and flea markets at the gates of Paris.",
    echo: "The city keeps everything, even what it let go.",
    level: 1,
    category: "Paris Secret",
    hint: "People often go on weekends to browse."
  },
  {
    id: "Q043",
    question: "Which Beaux-Arts bridge, opened for the 1900 World's Fair, is famous for its gilded lampposts?",
    choices: ["A. Pont de Bir-Hakeim", "B. Pont Alexandre III", "C. Pont Neuf", "D. Pont des Arts"],
    answer: "B",
    explanation: "The Pont Alexandre III was inaugurated in 1900 and is distinguished by its lavish Beaux-Arts decoration.",
    echo: "A stroke of gold laid on the water.",
    level: 1,
    category: "Belle Époque",
    hint: "It links the Invalides area to the Grand Palais."
  },
  {
    id: "Q044",
    question: "In which arrondissement is the Gare de Lyon located?",
    choices: ["A. 4th", "B. 10th", "C. 12th", "D. 15th"],
    answer: "C",
    explanation: "The Gare de Lyon is in the 12th arrondissement, near the Seine and the Place de la Bastille.",
    echo: "The trains leave, the city stays.",
    level: 1,
    category: "Repères",
    hint: "It is near Bercy and the Quai d'Austerlitz."
  },
  {
    id: "Q045",
    question: "Which iconic English-language bookstore faces Notre-Dame on the left bank?",
    choices: ["A. Galignani", "B. Shakespeare and Company", "C. La Hune", "D. Gibert Joseph"],
    answer: "B",
    explanation: "Shakespeare and Company is a legendary English-language bookstore near the Seine, facing Notre-Dame.",
    echo: "A refuge of paper, within earshot of the bells.",
    level: 1,
    category: "Art & Lettres",
    hint: "Its name is in English and it is near Saint-Michel."
  },
  {
    id: "Q046",
    question: "Which avenue links the Place de la Concorde to the Arc de Triomphe?",
    choices: ["A. Avenue des Champs-Élysées", "B. Boulevard Saint-Germain", "C. Rue de Rivoli", "D. Avenue Montaigne"],
    answer: "A",
    explanation: "The Avenue des Champs-Élysées runs between the Concorde and the Arc de Triomphe and is part of Paris's historic axis.",
    echo: "A line of desire drawn through the city.",
    level: 1,
    category: "XIXe siècle",
    hint: "Major victories and national celebrations are often held there."
  },
  {
    id: "Q047",
    question: "Which major venue for shows and conferences is located at Porte Maillot?",
    choices: ["A. Palais des Congrès de Paris", "B. Grand Palais", "C. Maison de la Radio", "D. Philharmonie de Paris"],
    answer: "A",
    explanation: "The Palais des Congrès de Paris is at Porte Maillot and hosts concerts, conferences, and trade shows.",
    echo: "Where the city gathers its voices.",
    level: 1,
    category: "XXe siècle",
    hint: "Next to the Place de la Porte Maillot."
  },
  {
    id: "Q048",
    question: "Which Paris island, known for its townhouses, lies just east of the Île de la Cité?",
    choices: ["A. Île aux Cygnes", "B. Île Saint-Louis", "C. Île de la Jatte", "D. Île Saint-Germain"],
    answer: "B",
    explanation: "The Île Saint-Louis is famous for its 17th-century architecture and residential atmosphere.",
    echo: "An island that listens to the river pass.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "It sits between the two arms of the Seine."
  },
  {
    id: "Q049",
    question: "Which medieval building still visible today is a 15th-century tower on the Rue Étienne-Marcel (near Réaumur)?",
    choices: ["A. Tour Jean-sans-Peur", "B. Conciergerie", "C. Hôtel de Sens", "D. Maison de Nicolas Flamel"],
    answer: "A",
    explanation: "The Tour Jean-sans-Peur is a 15th-century medieval remnant, linked to the Dukes of Burgundy.",
    echo: "A vertical stone that has forgotten nothing.",
    level: 1,
    category: "Moyen Âge",
    hint: "It is in the 2nd arrondissement."
  },
  {
    id: "Q050",
    question: "Which department store is famous for its large glass dome on the Boulevard Haussmann?",
    choices: ["A. Le Bon Marché", "B. Galeries Lafayette", "C. BHV Marais", "D. La Samaritaine"],
    answer: "B",
    explanation: "Galeries Lafayette Haussmann is known for its Art Nouveau dome and historic building.",
    echo: "Under a vault of glass, the crowd becomes ritual.",
    level: 1,
    category: "XIXe siècle",
    hint: "Near the Opéra Garnier."
  },
  {
    id: "Q051",
    question: "Which Paris square is famous for its octagonal shape and its jewelers?",
    choices: ["A. Place des Vosges", "B. Place Vendôme", "C. Place de la République", "D. Place du Tertre"],
    answer: "B",
    explanation: "The Place Vendôme is an octagonal square known for its hotels and jewelry houses.",
    echo: "The geometry of prestige, in silence.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "A very famous palace is also there."
  },
  {
    id: "Q052",
    question: "What is the name of the great historic opera house of Paris inaugurated in 1875?",
    choices: ["A. Opéra Bastille", "B. Opéra Garnier", "C. Théâtre du Châtelet", "D. Opéra Comique"],
    answer: "B",
    explanation: "The Opéra Garnier, inaugurated in 1875, is a major monument of 19th-century Paris.",
    echo: "A staircase where the city stages itself.",
    level: 1,
    category: "XIXe siècle",
    hint: "It is near the Opéra station."
  },
  {
    id: "Q053",
    question: "Which park in the 19th arrondissement is known for its cliffs, lake, and Temple of the Sibyl?",
    choices: ["A. Parc Montsouris", "B. Parc des Buttes-Chaumont", "C. Parc Monceau", "D. Jardin des Plantes"],
    answer: "B",
    explanation: "The Parc des Buttes-Chaumont offers a romantic landscape with a grotto, suspension bridge, and belvedere.",
    echo: "A nature composed like a set, and yet real.",
    level: 1,
    category: "XIXe siècle",
    hint: "It is near the Botzaris station."
  },
  {
    id: "Q054",
    question: "What are the covered commercial arcades of the 19th century called, like the Passage des Panoramas?",
    choices: ["A. Arcades", "B. Covered passages", "C. Interior courtyards", "D. Underground galleries"],
    answer: "B",
    explanation: "Covered passages are often glass-roofed pedestrian galleries, very much a feature of 19th-century Paris.",
    echo: "Interior streets where time slows down.",
    level: 1,
    category: "XIXe siècle",
    hint: "Many are near the Grands Boulevards."
  },
  {
    id: "Q055",
    question: "Which Paris museum is housed in a former train station and celebrates 19th-century art?",
    choices: ["A. Musée d'Orsay", "B. Musée Rodin", "C. Centre Pompidou", "D. Musée de l'Orangerie"],
    answer: "A",
    explanation: "The Musée d'Orsay occupies a former station and presents Impressionism and Post-Impressionism, among others.",
    echo: "A departure of trains become a departure of gazes.",
    level: 1,
    category: "Art & Lettres",
    hint: "It is on the left bank, facing the Louvre."
  },
  {
    id: "Q056",
    question: "Which Paris tea room is famous for its hot chocolate and Mont-Blanc dessert?",
    choices: ["A. Angelina", "B. Ladurée", "C. Pierre Hermé", "D. Dalloyau"],
    answer: "A",
    explanation: "Angelina, near the Rue de Rivoli, is renowned for its hot chocolate and the Mont-Blanc.",
    echo: "A sweet ritual that has warmed the centuries.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "People often go after a walk in the Tuileries."
  },
  {
    id: "Q057",
    question: "Which gilded statue stands in the Place des Pyramides, near the Louvre?",
    choices: ["A. Louis XIV", "B. Joan of Arc", "C. Napoleon I", "D. Henry IV"],
    answer: "B",
    explanation: "The statue of Joan of Arc stands in the Place des Pyramides, near the Louvre.",
    echo: "A presence standing straight amid the flow.",
    level: 1,
    category: "XIXe siècle",
    hint: "It is gilded and close to the Rue de Rivoli."
  },
  {
    id: "Q058",
    question: "Which Paris neighborhood gives its name to a major concert hall built in a former wine warehouse?",
    choices: ["A. Bercy", "B. Passy", "C. Auteuil", "D. Batignolles"],
    answer: "A",
    explanation: "Bercy was long a neighborhood of wine warehouses and now hosts major cultural venues.",
    echo: "When a city changes use, it changes rhythm.",
    level: 1,
    category: "XXe siècle",
    hint: "A large concert hall is there, near the park."
  },
  {
    id: "Q059",
    question: "What is the name of the oldest bridge in Paris still standing, despite its name?",
    choices: ["A. Pont Neuf", "B. Pont Marie", "C. Pont Royal", "D. Pont de la Tournelle"],
    answer: "A",
    explanation: "The Pont Neuf is the oldest surviving bridge in Paris and crosses the Seine at the tip of the Île de la Cité.",
    echo: "A stone that straddles time.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Its name means « new », but it has not been that for a long time."
  },
  {
    id: "Q060",
    question: "Which major Paris cemetery is known for its famous graves and tree-lined paths?",
    choices: ["A. Montparnasse", "B. Père-Lachaise", "C. Passy", "D. Montmartre"],
    answer: "B",
    explanation: "Père-Lachaise Cemetery is one of the best known in Paris and holds many notable graves.",
    echo: "A city of names, set apart from the noise.",
    level: 1,
    category: "Paris Secret",
    hint: "It is in the 20th arrondissement."
  },
  {
    id: "Q061",
    question: "Which neighborhood is associated with the Rue des Rosiers and Parisian Jewish history?",
    choices: ["A. Le Marais", "B. La Défense", "C. Bercy", "D. La Villette"],
    answer: "A",
    explanation: "The Marais includes a historic quarter around the Rue des Rosiers, known for its shops and restaurants.",
    echo: "A memory that also passes through the table.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "It is in the 4th arrondissement."
  },
  {
    id: "Q062",
    question: "Which major avenue in the 16th arrondissement is known for its width and trees?",
    choices: ["A. Avenue Foch", "B. Avenue de l'Opéra", "C. Boulevard Haussmann", "D. Avenue Ledru-Rollin"],
    answer: "A",
    explanation: "The Avenue Foch is a wide tree-lined avenue near the Arc de Triomphe.",
    echo: "A long breath in the stone.",
    level: 1,
    category: "XIXe siècle",
    hint: "It starts from the Place de l'Étoile."
  },
  {
    id: "Q063",
    question: "Which pastry was created in homage to a cycling race and is shaped like a wheel?",
    choices: ["A. Paris-Brest", "B. Mille-feuille", "C. Opéra", "D. Religieuse"],
    answer: "A",
    explanation: "The Paris-Brest was created in the early 20th century and its shape suggests a bicycle wheel.",
    echo: "A circle of sweetness born from a line of speed.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Its name is also that of a race between two cities."
  },
  {
    id: "Q064",
    question: "Which Paris boulevard is named after an Enlightenment philosopher and runs through the east of Paris?",
    choices: ["A. Boulevard Voltaire", "B. Boulevard Raspail", "C. Boulevard Haussmann", "D. Boulevard Saint-Michel"],
    answer: "A",
    explanation: "The Boulevard Voltaire links the Place de la République and the Place de la Nation, among others.",
    echo: "A name of an idea become a direction.",
    level: 1,
    category: "Art & Lettres",
    hint: "Voltaire is an 18th-century writer and philosopher."
  },
  {
    id: "Q065",
    question: "Which venue in the 6th arrondissement, founded in the 17th century, is often cited as one of the oldest cafés in Paris?",
    choices: ["A. Le Procope", "B. Le Select", "C. La Coupole", "D. Les Deux Magots"],
    answer: "A",
    explanation: "Le Procope is a historic café-restaurant in the Odéon quarter, linked to Parisian intellectual history.",
    echo: "Where speech long stood in for fire.",
    level: 1,
    category: "Art & Lettres",
    hint: "It is near the Rue de l'Ancienne-Comédie."
  },
  {
    id: "Q066",
    question: "Which cultural building has colored pipes visible on its façade in the Beaubourg quarter?",
    choices: ["A. Centre Pompidou", "B. Grand Palais", "C. Institut du Monde Arabe", "D. Maison de la Radio"],
    answer: "A",
    explanation: "The Centre Pompidou, inaugurated in 1977, is recognizable by its « inside-out » architecture.",
    echo: "A machine for seeing, turned toward the street.",
    level: 1,
    category: "XXe siècle",
    hint: "It is near the Marais."
  },
  {
    id: "Q067",
    question: "Which Paris stadium is associated with football and the Parc des Princes?",
    choices: ["A. Parc des Princes", "B. Stade Charléty", "C. Stade Jean-Bouin", "D. Stade de France"],
    answer: "A",
    explanation: "The Parc des Princes is a major Paris stadium known for hosting football matches.",
    echo: "An amphitheater of shouts, contained by stone.",
    level: 1,
    category: "XXe siècle",
    hint: "It is near the Porte de Saint-Cloud."
  },
  {
    id: "Q068",
    question: "Which Paris canal runs through locks and footbridges, between République and La Villette?",
    choices: ["A. Canal Saint-Martin", "B. Canal de l'Ourcq", "C. Canal Saint-Denis", "D. La Bièvre"],
    answer: "A",
    explanation: "The Canal Saint-Martin is known for its locks, quays, and metal footbridges.",
    echo: "A vein of slow water under the fast city.",
    level: 1,
    category: "XIXe siècle",
    hint: "It is closely linked to the 10th arrondissement."
  },
  {
    id: "Q069",
    question: "Which square near the Latin Quarter is famous for its large fountain with the Archangel Michael?",
    choices: ["A. Place Saint-Michel", "B. Place de la République", "C. Place de la Nation", "D. Place des Vosges"],
    answer: "A",
    explanation: "The Place Saint-Michel is marked by the Fontaine Saint-Michel, built in the 19th century.",
    echo: "A crossroads where water and stone answer each other.",
    level: 1,
    category: "XIXe siècle",
    hint: "It is at the end of the Boulevard Saint-Michel."
  },
  {
    id: "Q070",
    question: "Which major science venue is located in the Parc de la Villette?",
    choices: ["A. Cité des sciences et de l'industrie", "B. Palais de la Découverte", "C. Musée des Arts et Métiers", "D. Musée de l'Homme"],
    answer: "A",
    explanation: "The Cité des sciences et de l'industrie is a major science museum at La Villette.",
    echo: "Curiosity too has its cathedrals.",
    level: 1,
    category: "XXe siècle",
    hint: "A large sphere called the Géode is there."
  },
  {
    id: "Q071",
    question: "Which Paris station serves Brittany by TGV?",
    choices: ["A. Gare Montparnasse", "B. Gare de l'Est", "C. Gare du Nord", "D. Gare Saint-Lazare"],
    answer: "A",
    explanation: "The Gare Montparnasse is a major departure point for western France, including Brittany.",
    echo: "A gate open toward the ocean.",
    level: 1,
    category: "Repères",
    hint: "It is near the Tour Montparnasse."
  },
  {
    id: "Q072",
    question: "Which Saint-Germain-des-Prés café is associated with Sartre and Beauvoir?",
    choices: ["A. Les Deux Magots", "B. Le Procope", "C. La Coupole", "D. Le Train Bleu"],
    answer: "A",
    explanation: "Les Deux Magots is a famous Saint-Germain-des-Prés café, linked to the quarter's literary history.",
    echo: "A table can become an era.",
    level: 1,
    category: "Art & Lettres",
    hint: "It is near the Saint-Germain-des-Prés church."
  },
  {
    id: "Q073",
    question: "Which left-bank department store has long been presented as a pioneer of the department store?",
    choices: ["A. Le Bon Marché", "B. BHV Marais", "C. La Samaritaine", "D. Printemps Haussmann"],
    answer: "A",
    explanation: "Le Bon Marché is a historic left-bank department store associated with the rise of modern commerce.",
    echo: "The everyday, raised to the rank of showcase.",
    level: 1,
    category: "XIXe siècle",
    hint: "It is in the 7th arrondissement."
  },
  {
    id: "Q074",
    question: "Which pedestrian bridge links the Louvre to the Institut de France?",
    choices: ["A. Pont des Arts", "B. Pont d'Iéna", "C. Pont de Sully", "D. Pont Mirabeau"],
    answer: "A",
    explanation: "The Pont des Arts is a pedestrian bridge between the Louvre and the Institut de France.",
    echo: "A light passage for steps heavy with promises.",
    level: 1,
    category: "Paris Secret",
    hint: "It is a very photogenic bridge over the Seine."
  },
  {
    id: "Q075",
    question: "Which major Paris church stands in the Place Saint-Sulpice?",
    choices: ["A. Église Saint-Sulpice", "B. Église de la Madeleine", "C. Église Saint-Eustache", "D. Église Saint-Augustin"],
    answer: "A",
    explanation: "The Church of Saint-Sulpice is a major building in the 6th arrondissement, on a large square.",
    echo: "A volume of shadow amid the cafés.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "It is near the Jardin du Luxembourg."
  },
  {
    id: "Q076",
    question: "Which neighborhood in the 18th arrondissement is known for its markets and African-related commerce around Château Rouge?",
    choices: ["A. Château Rouge", "B. Bercy", "C. Passy", "D. Père-Lachaise"],
    answer: "A",
    explanation: "Château Rouge is an area in the 18th arrondissement known for its shops and market atmosphere.",
    echo: "A piece of the world set on a sidewalk.",
    level: 1,
    category: "Paris Secret",
    hint: "It is near Montmartre, to the north."
  },
  {
    id: "Q077",
    question: "Which museum tells the history of Paris and is located in the Marais?",
    choices: ["A. Musée Carnavalet", "B. Musée de Cluny", "C. Musée Guimet", "D. Musée Rodin"],
    answer: "A",
    explanation: "The Musée Carnavalet is dedicated to the history of Paris and is located in the Marais quarter.",
    echo: "A city can also be read in its objects.",
    level: 1,
    category: "Art & Lettres",
    hint: "It is in the 3rd arrondissement."
  },
  {
    id: "Q078",
    question: "Which métro station is known for its great depth at Montmartre?",
    choices: ["A. Abbesses", "B. Châtelet", "C. Odéon", "D. République"],
    answer: "A",
    explanation: "Abbesses station, on line 12, is known for its depth and long stairways.",
    echo: "You go down the better to come back up.",
    level: 1,
    category: "Paris Secret",
    hint: "It serves Montmartre."
  },
  {
    id: "Q079",
    question: "Which neighborhood in the 13th arrondissement is known for its large pedestrian deck and towers, near the Place d'Italie?",
    choices: ["A. Les Olympiades", "B. La Défense", "C. Beaugrenelle", "D. Bastille"],
    answer: "A",
    explanation: "Les Olympiades is an urban complex built on a deck in the 13th arrondissement.",
    echo: "A ground above the ground, for a life lived otherwise.",
    level: 1,
    category: "XXe siècle",
    hint: "It is near the Asian quarter."
  },
  {
    id: "Q080",
    question: "What is the name of the oldest covered market in Paris, located in the 3rd arrondissement?",
    choices: ["A. Marché des Enfants Rouges", "B. Marché d'Aligre", "C. Marché Raspail", "D. Marché Saint-Quentin"],
    answer: "A",
    explanation: "The Marché des Enfants Rouges is a historic covered market in the Haut-Marais.",
    echo: "Under the glass roof, languages mix.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "It is near the Rue de Bretagne."
  },
  {
    id: "Q081",
    question: "Which palace stands on the Place Vendôme and bears the name 'Ritz'?",
    choices: ["A. Ritz Paris", "B. Le Meurice", "C. Hôtel de Crillon", "D. Plaza Athénée"],
    answer: "A",
    explanation: "The Ritz Paris is an iconic palace on the Place Vendôme.",
    echo: "A name become a measure of the world.",
    level: 1,
    category: "Belle Époque",
    hint: "It is in the 1st arrondissement."
  },
  {
    id: "Q082",
    question: "What is the name of the great perspective aligning La Défense, the Arc de Triomphe, and the Louvre?",
    choices: ["A. Historic axis", "B. Petite Ceinture", "C. Roman road", "D. Grand Boulevard"],
    answer: "A",
    explanation: "People often speak of Paris's historic axis, a monumental perspective running through the west and center.",
    echo: "A straight line that crosses centuries.",
    level: 1,
    category: "Repères",
    hint: "It passes through the Champs-Élysées."
  },
  {
    id: "Q083",
    question: "In which garden do children often sail toy boats on a pond?",
    choices: ["A. Jardin du Luxembourg", "B. Parc Monceau", "C. Buttes-Chaumont", "D. Parc Montsouris"],
    answer: "A",
    explanation: "The Jardin du Luxembourg is known for its large pond where people sail toy boats.",
    echo: "A simple game, passed on in silence.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "It is on the left bank."
  },
  {
    id: "Q084",
    question: "Which Montmartre cabaret theater is recognizable by its large red windmill?",
    choices: ["A. Moulin Rouge", "B. L'Olympia", "C. Le Trianon", "D. Le Bataclan"],
    answer: "A",
    explanation: "The Moulin Rouge is a cabaret founded at the end of the 19th century, a symbol of Montmartre nightlife.",
    echo: "The night has its monuments too.",
    level: 1,
    category: "Belle Époque",
    hint: "It is near Pigalle."
  },
  {
    id: "Q085",
    question: "Which metal bridge with a métro level on top is a landmark near the Eiffel Tower?",
    choices: ["A. Pont de Bir-Hakeim", "B. Pont Alexandre III", "C. Pont Marie", "D. Pont au Change"],
    answer: "A",
    explanation: "The Pont de Bir-Hakeim is known for its metal structure and the elevated métro passage.",
    echo: "Two levels of city, one river.",
    level: 1,
    category: "XXe siècle",
    hint: "Métro line 6 runs over the Seine there."
  },
  {
    id: "Q086",
    question: "Which neighborhood is famous for its murals and street art around Belleville and Ménilmontant?",
    choices: ["A. Belleville", "B. Invalides", "C. Auteuil", "D. Place Vendôme"],
    answer: "A",
    explanation: "Belleville is known for its cultural energy and many murals visible in the streets.",
    echo: "Walls that speak without asking for the floor.",
    level: 1,
    category: "XXe siècle",
    hint: "It is in the northeast of Paris."
  },
  {
    id: "Q087",
    question: "Which major site of the Bibliothèque nationale de France is recognizable by its four book-shaped towers?",
    choices: ["A. Site François-Mitterrand", "B. Site Richelieu", "C. Bibliothèque Mazarine", "D. Bibliothèque Sainte-Geneviève"],
    answer: "A",
    explanation: "The BnF's François-Mitterrand site, inaugurated in the 1990s, is recognizable by its four towers.",
    echo: "Memory raised into a skyline.",
    level: 1,
    category: "XXe siècle",
    hint: "It is in the 13th arrondissement."
  },
  {
    id: "Q088",
    question: "Which avenue is associated with haute couture houses near the Champs-Élysées?",
    choices: ["A. Avenue Montaigne", "B. Boulevard Voltaire", "C. Rue Mouffetard", "D. Avenue de Clichy"],
    answer: "A",
    explanation: "The Avenue Montaigne is an iconic address for haute couture in Paris.",
    echo: "Elegance often begins with a street.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "It is near the Alma."
  },
  {
    id: "Q089",
    question: "Which left-bank student quarter takes its name from the former use of Latin?",
    choices: ["A. Latin Quarter", "B. Le Marais", "C. Montparnasse", "D. La Défense"],
    answer: "A",
    explanation: "The Latin Quarter is historically linked to the universities and Parisian intellectual life.",
    echo: "Ancient stones, a youth that endures.",
    level: 1,
    category: "Art & Lettres",
    hint: "It is around the Sorbonne."
  },
  {
    id: "Q090",
    question: "Which museum near the Eiffel Tower presents arts from Africa, Asia, Oceania, and the Americas?",
    choices: ["A. Musée du quai Branly - Jacques Chirac", "B. Musée Guimet", "C. Musée d'Orsay", "D. Musée Carnavalet"],
    answer: "A",
    explanation: "The Musée du quai Branly - Jacques Chirac is dedicated to non-Western arts and civilizations.",
    echo: "A whole world held in a garden.",
    level: 1,
    category: "Art & Lettres",
    hint: "Its building is associated with Jean Nouvel."
  },
  {
    id: "Q091",
    question: "What name is commonly associated with the Sorbonne, the historic place of learning in Paris?",
    choices: ["A. Sorbonne", "B. La Coupole", "C. Le Panthéon", "D. La Monnaie de Paris"],
    answer: "A",
    explanation: "The Sorbonne is an emblematic name in Parisian university history, at the heart of the Latin Quarter.",
    echo: "A place where words have the weight of stone.",
    level: 1,
    category: "Moyen Âge",
    hint: "It is near the Panthéon."
  },
  {
    id: "Q092",
    question: "Which commemorative column stands at the center of the Place Vendôme?",
    choices: ["A. Colonne Vendôme", "B. Colonne de Juillet", "C. Luxor Obelisk", "D. Colonne Morris"],
    answer: "A",
    explanation: "The Colonne Vendôme stands in the Place Vendôme and is one of the emblematic monuments of central Paris.",
    echo: "A spiral of bronze amid the calm.",
    level: 1,
    category: "XIXe siècle",
    hint: "The square is near the Jardin des Tuileries."
  },
  {
    id: "Q093",
    question: "Which Grand Slam tennis tournament is played every year in Paris?",
    choices: ["A. Roland-Garros", "B. Wimbledon", "C. US Open", "D. Australian Open"],
    answer: "A",
    explanation: "Roland-Garros is the Grand Slam tennis tournament held in Paris, on clay.",
    echo: "Red dust, stage of an elegant duel.",
    level: 1,
    category: "XXe siècle",
    hint: "It is played in the 16th arrondissement."
  },
  {
    id: "Q094",
    question: "Which Paris station is a major departure point for northern France and international destinations?",
    choices: ["A. Gare du Nord", "B. Gare d'Austerlitz", "C. Gare Saint-Lazare", "D. Gare de l'Est"],
    answer: "A",
    explanation: "The Gare du Nord serves many destinations to northern France and Europe.",
    echo: "Under the glass roof, the city multiplies.",
    level: 1,
    category: "Repères",
    hint: "It is in the 10th arrondissement."
  },
  {
    id: "Q095",
    question: "Which major Paris cinema is known for its large auditorium and Art Deco façade?",
    choices: ["A. Le Grand Rex", "B. La Pagode", "C. Le Champo", "D. UGC Les Halles"],
    answer: "A",
    explanation: "Le Grand Rex is an iconic Paris cinema, known for its large auditorium and events.",
    echo: "A palace where images become a crowd.",
    level: 1,
    category: "XXe siècle",
    hint: "It is on the Grands Boulevards."
  },
  {
    id: "Q096",
    question: "Which Paris museum presents collections of science and inventions in the former abbey of Saint-Martin-des-Champs?",
    choices: ["A. Musée des Arts et Métiers", "B. Musée de l'Homme", "C. Palais de la Découverte", "D. Cité de l'Architecture"],
    answer: "A",
    explanation: "The Musée des Arts et Métiers is devoted to science, technology, and inventions, in a historic setting.",
    echo: "Human genius displayed like a relic.",
    level: 1,
    category: "XXe siècle",
    hint: "It is in the 3rd arrondissement."
  },
  {
    id: "Q097",
    question: "Which Paris monument houses the tomb of Napoleon I under a large gilded dome?",
    choices: ["A. Les Invalides", "B. Le Panthéon", "C. La Madeleine", "D. Saint-Denis"],
    answer: "A",
    explanation: "Les Invalides houses the tomb of Napoleon I and an important military museum.",
    echo: "Under the gold, a heavy history sleeps.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "It can be seen from the Pont Alexandre III."
  },
  {
    id: "Q098",
    question: "Which park east of Paris is associated with the Lac Daumesnil and the Bois de Vincennes?",
    choices: ["A. Bois de Vincennes", "B. Bois de Boulogne", "C. Parc Monceau", "D. Parc de Belleville"],
    answer: "A",
    explanation: "The Bois de Vincennes is a large green space east of Paris, with lakes and gardens.",
    echo: "A long breath at the edge of the city.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "It is near the 12th arrondissement."
  },
  {
    id: "Q099",
    question: "Which Paris botanical garden houses a menagerie (zoo) and large greenhouses?",
    choices: ["A. Jardin des Plantes", "B. Parc Floral", "C. Jardin d'Acclimatation", "D. Parc de Sceaux"],
    answer: "A",
    explanation: "The Jardin des Plantes is Paris's great botanical garden and houses the Ménagerie and greenhouses.",
    echo: "A living world kept at the heart of the mineral.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "It is linked to the Muséum national d'Histoire naturelle."
  },
  {
    id: "Q100",
    question: "Which metropolitan transport project is associated with new automated lines around Paris?",
    choices: ["A. Grand Paris Express", "B. Métro RER A", "C. Tramway T1", "D. Historic Line 1"],
    answer: "A",
    explanation: "The Grand Paris Express is a project for new métro lines around Paris to better connect the metropolis.",
    echo: "The city widens its circle, slowly.",
    level: 1,
    category: "XXe siècle",
    hint: "New orbital lines around Paris are planned."
  },
  {
    id: "Q101",
    question: "Which Paris monument houses the Sainte-Chapelle?",
    choices: ["A. The Palais de Justice (Île de la Cité)", "B. Le Panthéon", "C. Les Invalides", "D. Le Grand Palais"],
    answer: "A",
    explanation: "The Sainte-Chapelle is within the former royal palace of the Cité, now part of the Palais de Justice, on the Île de la Cité.",
    echo: "Light becomes stone, then stained glass.",
    level: 1,
    category: "Moyen Âge",
    hint: "On the Île de la Cité, near Notre-Dame."
  },
  {
    id: "Q102",
    question: "In which Paris museum can you see Claude Monet's large \"Water Lilies\"?",
    choices: ["A. Musée du Louvre", "B. Musée de l'Orangerie", "C. Musée Rodin", "D. Centre Pompidou"],
    answer: "B",
    explanation: "Monet's \"Water Lilies\" are displayed in two oval rooms specially designed at the Musée de l'Orangerie, in the Jardin des Tuileries.",
    echo: "Two ovals of silence, and the water begins to breathe.",
    level: 1,
    category: "Art & Lettres",
    hint: "It is near the Place de la Concorde."
  },
  {
    id: "Q103",
    question: "Which Paris monument is nicknamed \"the Iron Lady\"?",
    choices: ["A. Tour Saint-Jacques", "B. The Eiffel Tower", "C. Tour Montparnasse", "D. La Grande Arche"],
    answer: "B",
    explanation: "The Eiffel Tower, built for the 1889 World's Fair, is often called \"the Iron Lady\" because of its metal structure.",
    echo: "A skeleton of metal, become a tender landmark.",
    level: 1,
    category: "Belle Époque",
    hint: "It overlooks the Champ-de-Mars."
  },
  {
    id: "Q104",
    question: "Which major boulevard leads directly to the Opéra Garnier from the Place de la Madeleine?",
    choices: ["A. Boulevard Haussmann", "B. Boulevard Saint-Michel", "C. Boulevard Voltaire", "D. Boulevard de Sébastopol"],
    answer: "A",
    explanation: "The Boulevard Haussmann, laid out in the 19th century, links the Madeleine area to the Opéra and runs through the department-store quarter.",
    echo: "A straight artery where the city stages itself.",
    level: 1,
    category: "XIXe siècle",
    hint: "The great department stores are there."
  },
  {
    id: "Q105",
    question: "Which Paris monument bears the flame in tribute to Liberty, near the Pont de l'Alma?",
    choices: ["A. The Colonne de Juillet", "B. The Flamme de la Liberté", "C. Le Génie de la Bastille", "D. The Statue of Joan of Arc"],
    answer: "B",
    explanation: "The Flamme de la Liberté is a replica of the Statue of Liberty's flame, installed near the Pont de l'Alma.",
    echo: "A motionless flame that draws memories.",
    level: 1,
    category: "Repères",
    hint: "A stone's throw from the Pont de l'Alma."
  },
  {
    id: "Q106",
    question: "Which Paris museum is housed in a former palace, the Hôtel Salé, in the Marais?",
    choices: ["A. Musée Picasso", "B. Musée de l'Orangerie", "C. Musée Guimet", "D. Musée Marmottan Monet"],
    answer: "A",
    explanation: "The Musée national Picasso-Paris is housed in the Hôtel Salé, a 17th-century townhouse in the Marais.",
    echo: "A modern genius lodged in an old house.",
    level: 1,
    category: "Art & Lettres",
    hint: "In the 3rd arrondissement, Marais quarter."
  },
  {
    id: "Q107",
    question: "Which Paris square is known for its central statue and major demonstrations?",
    choices: ["A. Place des Vosges", "B. Place de la République", "C. Place Dauphine", "D. Place du Palais-Royal"],
    answer: "B",
    explanation: "The Place de la République is a major Paris crossroads, often a site of gatherings and demonstrations, dominated by a statue of Marianne.",
    echo: "A square like a lung, when the city speaks.",
    level: 1,
    category: "Repères",
    hint: "Between the 3rd, 10th, and 11th arrondissements."
  },
  {
    id: "Q108",
    question: "Which Paris museum is dedicated to Auguste Rodin and his sculptures?",
    choices: ["A. Musée Rodin", "B. Musée Maillol", "C. Musée d'Art Moderne", "D. Musée de Cluny"],
    answer: "A",
    explanation: "The Musée Rodin presents many works by Auguste Rodin, including \"The Thinker\", in the Hôtel Biron and its gardens.",
    echo: "The bronze thinks, and the garden listens.",
    level: 1,
    category: "Art & Lettres",
    hint: "Near Les Invalides, left bank."
  },
  {
    id: "Q109",
    question: "What is the name of the monumental arch at the center of the Place de l'Étoile?",
    choices: ["A. Arc de Triomphe", "B. Arc de la Défense", "C. Arc du Carrousel", "D. Porte Saint-Martin"],
    answer: "A",
    explanation: "The Arc de Triomphe, commissioned by Napoleon I, stands at the center of the Place Charles-de-Gaulle (Place de l'Étoile).",
    echo: "A circle of roads, a stone that commands the gaze.",
    level: 1,
    category: "XIXe siècle",
    hint: "At the top of the Champs-Élysées."
  },
  {
    id: "Q110",
    question: "Which Paris monument is famous for its great dome and Foucault's pendulum?",
    choices: ["A. Le Panthéon", "B. La Madeleine", "C. Saint-Eustache", "D. Saint-Germain-des-Prés"],
    answer: "A",
    explanation: "The Panthéon, on the Montagne Sainte-Geneviève, hosted Foucault's pendulum experiment and houses the tombs of great French figures.",
    echo: "Under the dome, the Earth admits it turns.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "In the 5th arrondissement."
  },
  {
    id: "Q111",
    question: "What is the name of the large Paris square bordered by arcades, at the heart of the Marais?",
    choices: ["A. Place des Vosges", "B. Place Vendôme", "C. Place de la Concorde", "D. Place Saint-Sulpice"],
    answer: "A",
    explanation: "The Place des Vosges, built in the early 17th century, is an emblematic arcaded square in the Marais.",
    echo: "A perfect square, where time slows down.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "It is near Victor Hugo's house."
  },
  {
    id: "Q112",
    question: "Which Paris museum is devoted to the Middle Ages and Gallo-Roman baths?",
    choices: ["A. Musée de Cluny", "B. Musée Carnavalet", "C. Musée de l'Armée", "D. Musée Jacquemart-André"],
    answer: "A",
    explanation: "The Musée de Cluny (Musée national du Moyen Âge) occupies a medieval townhouse and remains of Gallo-Roman baths.",
    echo: "Centuries stacked in a single courtyard.",
    level: 1,
    category: "Moyen Âge",
    hint: "Left bank, near the Boulevard Saint-Michel."
  },
  {
    id: "Q113",
    question: "Which major Paris street runs along the Louvre and crosses the center on the right bank?",
    choices: ["A. Rue de Rivoli", "B. Rue Mouffetard", "C. Rue Lepic", "D. Rue Daguerre"],
    answer: "A",
    explanation: "The Rue de Rivoli runs along the Louvre and the Tuileries and stretches east. Its arcades are a landmark of central Paris.",
    echo: "A street like a gallery, between stone and shopfronts.",
    level: 1,
    category: "Repères",
    hint: "It runs along the Tuileries and the Louvre."
  },
  {
    id: "Q114",
    question: "Which Paris monument is a major center for science and Arab culture, with a mashrabiya-style façade?",
    choices: ["A. Institut du Monde Arabe", "B. Maison de la Radio", "C. Palais de Tokyo", "D. Musée Guimet"],
    answer: "A",
    explanation: "The Institut du Monde Arabe, designed in part by Jean Nouvel, is known for its façade with motifs inspired by mashrabiyas.",
    echo: "Light filters through, and the city learns other rhythms.",
    level: 1,
    category: "XXe siècle",
    hint: "On the quais, near Jussieu."
  },
  {
    id: "Q115",
    question: "Which Paris bridge is famous for its love locks (now removed) and its view of the Île de la Cité?",
    choices: ["A. Pont des Arts", "B. Pont Mirabeau", "C. Pont de Bir-Hakeim", "D. Pont de Sully"],
    answer: "A",
    explanation: "The Pont des Arts long bore love locks, removed to preserve its structure. It is a pedestrian bridge with an iconic view of the Seine.",
    echo: "Promises weigh; the Seine carries the rest away.",
    level: 1,
    category: "Paris Secret",
    hint: "Pedestrian, between the Louvre and the Institut de France."
  },
  {
    id: "Q116",
    question: "Which Paris garden is known for its large pond where children sail toy boats?",
    choices: ["A. Jardin du Luxembourg", "B. Parc Monceau", "C. Parc André Citroën", "D. Square du Temple"],
    answer: "A",
    explanation: "The Jardin du Luxembourg is famous for its large pond where children sail miniature boats, and for its statues and paths.",
    echo: "Small sails to learn the wind.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "In the 6th arrondissement."
  },
  {
    id: "Q117",
    question: "Which major historic Paris library is near the Panthéon and has a spectacular reading room?",
    choices: ["A. Bibliothèque Sainte-Geneviève", "B. Bibliothèque Mazarine", "C. Bibliothèque de l'Arsenal", "D. Bibliothèque François-Mitterrand"],
    answer: "A",
    explanation: "The Bibliothèque Sainte-Geneviève, in the 5th arrondissement, is known for its great 19th-century reading room.",
    echo: "A ship of books, lit like a nave.",
    level: 1,
    category: "XIXe siècle",
    hint: "Facing the Panthéon."
  },
  {
    id: "Q118",
    question: "Which Paris monument is a column topped by a spirit figure, on the Place de la Bastille?",
    choices: ["A. Colonne de Juillet", "B. Colonne Vendôme", "C. Luxor Obelisk", "D. Colonne Morris"],
    answer: "A",
    explanation: "The Colonne de Juillet commemorates the July Revolution (1830) and stands at the center of the Place de la Bastille, topped by the Spirit of Liberty.",
    echo: "A column for days of fire, become an everyday landmark.",
    level: 1,
    category: "XIXe siècle",
    hint: "Place de la Bastille."
  },
  {
    id: "Q119",
    question: "Which Paris museum presents the history of arts and crafts, with a large collection of inventions?",
    choices: ["A. Musée des Arts et Métiers", "B. Palais de la Découverte", "C. Musée Grévin", "D. Cité de l'Architecture"],
    answer: "A",
    explanation: "The Musée des Arts et Métiers holds scientific and technical objects, including Foucault's pendulum and invention prototypes.",
    echo: "Old machines that still make the future dream.",
    level: 1,
    category: "XXe siècle",
    hint: "In the 3rd arrondissement, near Réaumur-Sébastopol."
  },
  {
    id: "Q120",
    question: "Which métro station is known for its Art Nouveau décor and spiral stairways near Montmartre?",
    choices: ["A. Abbesses", "B. Châtelet", "C. Nation", "D. Trocadéro"],
    answer: "A",
    explanation: "Abbesses station, in Montmartre, is often cited for its décor and great depth, with access by stairs or elevator.",
    echo: "A métro shaft that opens onto a village.",
    level: 1,
    category: "Paris Secret",
    hint: "On line 12, at Montmartre."
  },
  {
    id: "Q121",
    question: "What is the name of the large Paris esplanade between the Louvre and the Arc de Triomphe du Carrousel?",
    choices: ["A. Cour Carrée", "B. Place du Carrousel", "C. Place de la Nation", "D. Place de Clichy"],
    answer: "B",
    explanation: "The Place du Carrousel lies between the Louvre and the Jardin des Tuileries, near the Arc de Triomphe du Carrousel.",
    echo: "A threshold where the palace becomes a garden.",
    level: 1,
    category: "Repères",
    hint: "Right next to the Louvre pyramid."
  },
  {
    id: "Q122",
    question: "Which Paris museum is devoted to Asian civilizations and is located near the Trocadéro?",
    choices: ["A. Musée Guimet", "B. Musée du Quai Branly", "C. Musée de l'Orangerie", "D. Musée Zadkine"],
    answer: "A",
    explanation: "The Musée Guimet is a museum devoted to Asian arts, established in Paris since the end of the 19th century.",
    echo: "Distant worlds, gathered in a single room.",
    level: 1,
    category: "Art & Lettres",
    hint: "In the 16th arrondissement, near Iéna."
  },
  {
    id: "Q123",
    question: "Which very old Paris market is in the Marais and known for its food stalls?",
    choices: ["A. Marché des Enfants Rouges", "B. Marché d'Aligre", "C. Marché Raspail", "D. Marché Beauvau"],
    answer: "A",
    explanation: "The Marché des Enfants Rouges, created in the 17th century, is a covered market in the Marais, known for its food stalls.",
    echo: "A hall where the world fits on a plate.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "In the 3rd arrondissement."
  },
  {
    id: "Q124",
    question: "Which Paris monument is an exhibition palace with a large glass roof, near the Champs-Élysées?",
    choices: ["A. Grand Palais", "B. Palais Brongniart", "C. Hôtel de Ville", "D. Institut de France"],
    answer: "A",
    explanation: "The Grand Palais, built for the 1900 World's Fair, is famous for its great glass and metal nave.",
    echo: "Under the glass, the city becomes an exhibition cathedral.",
    level: 1,
    category: "Belle Époque",
    hint: "With the Petit Palais, near the Pont Alexandre III."
  },
  {
    id: "Q125",
    question: "What is the name of the Paris neighborhood around the Rue Mouffetard, known for its market and atmosphere?",
    choices: ["A. Latin Quarter", "B. Mouffetard / Mouffe", "C. Batignolles", "D. Passy"],
    answer: "B",
    explanation: "The Rue Mouffetard is one of the oldest streets in Paris, known for its market and popular atmosphere on the Montagne Sainte-Geneviève.",
    echo: "A street that smells of bread, cheese, and life.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "In the 5th arrondissement."
  },
  {
    id: "Q126",
    question: "What is the name of the Paris church famous for its classical façade and great organ, on the Place de la Madeleine?",
    choices: ["A. Église Saint-Eustache", "B. Église de la Madeleine", "C. Église Saint-Roch", "D. Église Saint-Augustin"],
    answer: "B",
    explanation: "The Church of the Madeleine, in Neoclassical style, stands on the Place de la Madeleine and resembles an ancient temple.",
    echo: "A temple set amid the avenues.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Near the department stores and the Opéra."
  },
  {
    id: "Q127",
    question: "Which Paris monument is a former market that became a major commercial and cultural center at the heart of the city?",
    choices: ["A. Les Halles", "B. La Villette", "C. Bercy Village", "D. Beaugrenelle"],
    answer: "A",
    explanation: "The Halles quarter long housed Paris's main market before being transformed. Today it is a major hub for transit and commerce.",
    echo: "Under the city, the flows continue.",
    level: 1,
    category: "Repères",
    hint: "In the center, near Châtelet."
  },
  {
    id: "Q128",
    question: "Which Paris museum holds the \"Venus de Milo\" and the \"Winged Victory of Samothrace\"?",
    choices: ["A. Musée du Louvre", "B. Musée d'Orsay", "C. Musée de l'Orangerie", "D. Musée du Quai Branly"],
    answer: "A",
    explanation: "The Louvre holds major works from antiquity, including the Venus de Milo and the Winged Victory of Samothrace.",
    echo: "Stone bodies that cross empires.",
    level: 1,
    category: "Art & Lettres",
    hint: "The great museum on the banks of the Seine."
  },
  {
    id: "Q129",
    question: "What is the name of the major tree-lined avenue that links the Place de la Nation to the Place de la Bastille?",
    choices: ["A. Boulevard Saint-Germain", "B. Boulevard Voltaire", "C. Avenue Daumesnil", "D. Rue de Belleville"],
    answer: "B",
    explanation: "The Boulevard Voltaire links the Place de la République to the Place de la Nation, crossing eastern Paris.",
    echo: "A taut line, between squares and revolts.",
    level: 1,
    category: "XIXe siècle",
    hint: "It bears the name of a philosopher."
  },
  {
    id: "Q130",
    question: "Which elevated walkway, on an old railway line, runs through the east of Paris?",
    choices: ["A. Coulée verte René-Dumont", "B. Promenade des Anglais", "C. Petite Ceinture (open everywhere)", "D. Voie Georges-Pompidou"],
    answer: "A",
    explanation: "The Coulée verte René-Dumont (promenade plantée) follows an old railway line and offers an elevated walk through eastern Paris.",
    echo: "Walking above the noise, on an old dormant line.",
    level: 1,
    category: "Paris Secret",
    hint: "Start near Bastille, heading east."
  },
  {
    id: "Q131",
    question: "Which Paris monument is a major modern concert hall in the Parc de la Villette?",
    choices: ["A. Philharmonie de Paris", "B. Salle Pleyel", "C. Opéra Garnier", "D. Théâtre de l'Odéon"],
    answer: "A",
    explanation: "The Philharmonie de Paris, in the Parc de la Villette, is a major contemporary concert hall devoted in part to symphonic music.",
    echo: "A vessel for sound, set in the park.",
    level: 1,
    category: "XXe siècle",
    hint: "In the 19th arrondissement."
  },
  {
    id: "Q132",
    question: "What is the name of the Paris canal known for its locks and footbridges, near République?",
    choices: ["A. Canal Saint-Martin", "B. Canal de l'Ourcq", "C. Canal Saint-Denis", "D. Bièvre"],
    answer: "A",
    explanation: "The Canal Saint-Martin is famous for its locks, footbridges, and quays, and links the Bassin de la Villette to the Seine.",
    echo: "Slow water to calm the fast city.",
    level: 1,
    category: "XIXe siècle",
    hint: "It runs near République and the 10th."
  },
  {
    id: "Q133",
    question: "Which Paris monument is a great oval hall that houses a national literary institution?",
    choices: ["A. Institut de France", "B. Palais Bourbon", "C. Hôtel de Ville", "D. Palais de Justice"],
    answer: "A",
    explanation: "The Institut de France, on the quais, houses several academies, including the Académie française.",
    echo: "Words under a dome, like invisible laws.",
    level: 1,
    category: "Art & Lettres",
    hint: "Facing the Louvre, on the other bank."
  },
  {
    id: "Q134",
    question: "What is the name of the Paris wax museum where you see statues of celebrities?",
    choices: ["A. Musée Grévin", "B. Musée Jacquemart-André", "C. Musée Marmottan Monet", "D. Musée Bourdelle"],
    answer: "A",
    explanation: "The Musée Grévin is a wax museum where historical and contemporary figures are represented.",
    echo: "Motionless faces, and yet familiar.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Near the Grands Boulevards."
  },
  {
    id: "Q135",
    question: "Which Paris monument is a large iron tower located near the Champ-de-Mars?",
    choices: ["A. Eiffel Tower", "B. Tour Saint-Jacques", "C. Tour Montparnasse", "D. Tour First"],
    answer: "A",
    explanation: "The Eiffel Tower stands at the edge of the Champ-de-Mars and is one of the city's major landmarks.",
    echo: "A fixed point to find your way, even when you're lost.",
    level: 1,
    category: "Repères",
    hint: "In the 7th arrondissement."
  },
  {
    id: "Q136",
    question: "Which major Paris cemetery is on the hill of Montmartre?",
    choices: ["A. Cimetière de Passy", "B. Cimetière de Montmartre", "C. Cimetière du Père-Lachaise", "D. Cimetière de Bagneux"],
    answer: "B",
    explanation: "Montmartre Cemetery is at the foot of the butte, in an old quarry. Many notable graves are there.",
    echo: "A garden of stones, under the artists' hill.",
    level: 1,
    category: "Paris Secret",
    hint: "In the 18th arrondissement."
  },
  {
    id: "Q137",
    question: "Which Paris museum is dedicated to the history of Paris and is located in the Marais?",
    choices: ["A. Musée Carnavalet", "B. Musée de Cluny", "C. Musée de l'Air et de l'Espace", "D. Musée de l'Orangerie"],
    answer: "A",
    explanation: "The Musée Carnavalet presents the history of Paris from its origins to today, in Marais townhouses.",
    echo: "The city tells its own story, piece by piece.",
    level: 1,
    category: "Art & Lettres",
    hint: "In the 3rd arrondissement."
  },
  {
    id: "Q138",
    question: "What is the name of the Great Mosque of Paris located near the Jardin des Plantes?",
    choices: ["A. Grande Mosquée de Paris", "B. Mosquée de Saint-Denis", "C. Mosquée de la Défense", "D. Mosquée de Montparnasse"],
    answer: "A",
    explanation: "The Grande Mosquée de Paris, inaugurated between the wars, is near the Jardin des Plantes and includes an interior garden and a tea room.",
    echo: "A calm patio, a step away from the noisy streets.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "In the 5th arrondissement."
  },
  {
    id: "Q139",
    question: "What is the name of the great Paris building where the Assemblée nationale sits?",
    choices: ["A. Palais Bourbon", "B. Palais du Luxembourg", "C. Élysée", "D. Palais de Justice"],
    answer: "A",
    explanation: "The Assemblée nationale sits in the Palais Bourbon, on the left bank of the Seine.",
    echo: "A hemicycle, and centuries of debate.",
    level: 1,
    category: "Repères",
    hint: "Facing the Place de la Concorde, on the other side of the river."
  },
  {
    id: "Q140",
    question: "Which Paris garden is behind the Palais Royal, with its striped columns and galleries?",
    choices: ["A. Jardin du Palais-Royal", "B. Jardin des Plantes", "C. Parc Monceau", "D. Square des Batignolles"],
    answer: "A",
    explanation: "The Jardin du Palais-Royal is a central garden surrounded by galleries. In its courtyard are the famous Buren columns.",
    echo: "A secret garden at the heart of power.",
    level: 1,
    category: "Paris Secret",
    hint: "Near the Louvre."
  },
  {
    id: "Q141",
    question: "Which Paris monument is a monumental gate dedicated to Saint Denis, on the Grands Boulevards?",
    choices: ["A. Porte Saint-Denis", "B. Porte Saint-Martin", "C. Arc du Carrousel", "D. Barrière d'Enfer"],
    answer: "A",
    explanation: "The Porte Saint-Denis is a 17th-century monumental arch on the Grands Boulevards.",
    echo: "A gate that no longer opens the city, but opens memory.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "On the Grands Boulevards, 10th arrondissement."
  },
  {
    id: "Q142",
    question: "What is the name of the famous Montmartre cabaret associated with singer-songwriters and artists?",
    choices: ["A. Le Lapin Agile", "B. Le Lido", "C. Le Procope", "D. Le Train Bleu"],
    answer: "A",
    explanation: "Le Lapin Agile is a historic Montmartre cabaret, associated with the quarter's artistic life.",
    echo: "A small stage where the night becomes legend.",
    level: 1,
    category: "Paris Secret",
    hint: "On the butte Montmartre."
  },
  {
    id: "Q143",
    question: "What is the name of the major concert hall on the Avenue Montaigne, known for its acoustics?",
    choices: ["A. Théâtre des Champs-Élysées", "B. Salle Pleyel", "C. Olympia", "D. Zénith de Paris"],
    answer: "B",
    explanation: "The Salle Pleyel is an iconic classical concert hall in the 8th arrondissement.",
    echo: "A hall where sound has its own architecture.",
    level: 1,
    category: "Art & Lettres",
    hint: "In the 8th, near the Champs-Élysées."
  },
  {
    id: "Q144",
    question: "Which Paris monument is an iconic music venue on the Boulevard des Capucines?",
    choices: ["A. Olympia", "B. Zénith", "C. Opéra Bastille", "D. Théâtre Mogador"],
    answer: "A",
    explanation: "The Olympia is a historic Paris venue, associated with many singing artists.",
    echo: "A stage, and voices that remain.",
    level: 1,
    category: "XXe siècle",
    hint: "Between Madeleine and Opéra."
  },
  {
    id: "Q145",
    question: "What is the name of the Paris palace where the Senate sits?",
    choices: ["A. Palais du Luxembourg", "B. Palais Bourbon", "C. Palais de Chaillot", "D. Palais Brongniart"],
    answer: "A",
    explanation: "The Senate sits in the Palais du Luxembourg, adjoining the Jardin du Luxembourg.",
    echo: "The law in the shade of the chestnut trees.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "In the 6th arrondissement."
  },
  {
    id: "Q146",
    question: "What is the name of the Paris museum devoted to natural history, linked to the Jardin des Plantes?",
    choices: ["A. Muséum national d'Histoire naturelle", "B. Musée d'Orsay", "C. Musée de l'Armée", "D. Musée Guimet"],
    answer: "A",
    explanation: "The Muséum national d'Histoire naturelle is linked to the Jardin des Plantes and brings together several scientific galleries.",
    echo: "The city also keeps the laws of the living.",
    level: 1,
    category: "XXe siècle",
    hint: "Around the Jardin des Plantes."
  },
  {
    id: "Q147",
    question: "Which Paris bridge is recognizable by its large metal arches and its view of the Eiffel Tower?",
    choices: ["A. Pont de Bir-Hakeim", "B. Pont Neuf", "C. Pont Marie", "D. Pont Alexandre III"],
    answer: "A",
    explanation: "The Pont de Bir-Hakeim, with its metal structure and upper level (métro), is a much-photographed landmark.",
    echo: "Two levels, two speeds, one river.",
    level: 1,
    category: "XXe siècle",
    hint: "Between 15th and 16th, near the Île aux Cygnes."
  },
  {
    id: "Q148",
    question: "What is the name of the symbol that is the official emblem of Paris, often shown on its coat of arms?",
    choices: ["A. Marianne", "B. The ship (nef)", "C. The Eiffel Tower", "D. The rooster"],
    answer: "B",
    explanation: "The traditional emblem of Paris is a ship (nef), visible on the city's coat of arms and linked to the boatmen of the Seine.",
    echo: "The city floats, even when everything moves.",
    level: 1,
    category: "Origines",
    hint: "You see it on the coat of arms of Paris."
  },
  {
    id: "Q149",
    question: "What is the name of the Paris hill that gave its name to a famous white basilica?",
    choices: ["A. Butte Montmartre", "B. Mont Valérien", "C. Montparnasse", "D. Belleville"],
    answer: "A",
    explanation: "The Butte Montmartre is the hill in the north of Paris, dominated by the Basilica of the Sacré-Cœur.",
    echo: "A hill, and the whole city below.",
    level: 1,
    category: "Repères",
    hint: "North of Paris."
  },
  {
    id: "Q150",
    question: "What is the name of the major popular market in Paris located near the Place de la Nation?",
    choices: ["A. Marché d'Aligre", "B. Marché Raspail", "C. Marché Bastille", "D. Marché Saint-Quentin"],
    answer: "A",
    explanation: "The Marché d'Aligre (in the 12th) is a popular market known for its atmosphere and its covered hall.",
    echo: "The city recognizes itself in its stalls.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "In the 12th, Aligre quarter."
  },
  {
    id: "Q151",
    question: "Which Paris monument is a large fountain topped with wings, at the end of the Jardin des Tuileries?",
    choices: ["A. Fontaine Saint-Michel", "B. Fontaine des Mers", "C. Fontaine des Fleuves (Concorde)", "D. Fontaine de la Rotonde"],
    answer: "C",
    explanation: "The Place de la Concorde has two great 19th-century monumental fountains, dedicated to rivers and seas.",
    echo: "Water draws circles where history cut through.",
    level: 1,
    category: "XIXe siècle",
    hint: "On the large square between the Tuileries and the Champs-Élysées."
  },
  {
    id: "Q152",
    question: "What is the name of the major Paris avenue where many embassies and townhouses are located?",
    choices: ["A. Rue de Rivoli", "B. Avenue Foch", "C. Rue du Faubourg Saint-Honoré", "D. Boulevard de Belleville"],
    answer: "C",
    explanation: "The Rue du Faubourg Saint-Honoré is known for its embassies, townhouses, shops, and proximity to the Élysée.",
    echo: "A street where the façades keep secrets.",
    level: 1,
    category: "Repères",
    hint: "In the 8th arrondissement."
  },
  {
    id: "Q153",
    question: "Which Paris museum is in a former workshop and presents the sculptures of Antoine Bourdelle?",
    choices: ["A. Musée Bourdelle", "B. Musée Zadkine", "C. Musée Rodin", "D. Petit Palais"],
    answer: "A",
    explanation: "The Musée Bourdelle, near Montparnasse, occupies the former workshop of the sculptor Antoine Bourdelle.",
    echo: "A workshop frozen, as if the hands were about to return.",
    level: 1,
    category: "Art & Lettres",
    hint: "In the 15th arrondissement."
  },
  {
    id: "Q154",
    question: "What is the name of the large Paris square where the Opéra Bastille is located?",
    choices: ["A. Place de la République", "B. Place de la Bastille", "C. Place d'Italie", "D. Place Denfert-Rochereau"],
    answer: "B",
    explanation: "The Opéra Bastille is on the Place de la Bastille, a central site of revolutionary history and the main axes of eastern Paris.",
    echo: "A square where history changes costume, but not its breath.",
    level: 1,
    category: "Repères",
    hint: "Between the 4th, 11th, and 12th."
  },
  {
    id: "Q155",
    question: "What is the name of the major commercial artery in the north of Paris, famous for its fabrics and shops, near Barbès?",
    choices: ["A. Rue de Belleville", "B. Boulevard de Strasbourg", "C. Boulevard de Rochechouart", "D. Rue du Faubourg Saint-Denis"],
    answer: "C",
    explanation: "The Boulevard de Rochechouart, at the foot of Montmartre, is a very lively axis, especially toward Barbès and Pigalle.",
    echo: "At the foot of the hill, the city speeds up.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Between Barbès and Pigalle."
  },
  {
    id: "Q156",
    question: "Which Paris monument is a monumental rotunda marking the southern entrance to the city, near the Parc Montsouris?",
    choices: ["A. Barrière d'Enfer (place Denfert-Rochereau)", "B. Porte de Vincennes", "C. Porte Maillot", "D. Porte de Saint-Cloud"],
    answer: "A",
    explanation: "The Ledoux pavilions, known as the Barrière d'Enfer, stand in the Place Denfert-Rochereau and are remnants of Paris's old barriers.",
    echo: "Gates that counted the city, before it overflowed.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "To the south, near the Catacombes."
  },
  {
    id: "Q157",
    question: "What is the name of the major contemporary art center located near the Seine, facing the Trocadéro?",
    choices: ["A. Palais de Tokyo", "B. Musée de l'Orangerie", "C. Musée Grévin", "D. Musée de Cluny"],
    answer: "A",
    explanation: "The Palais de Tokyo is a major contemporary art venue in Paris, located near the Trocadéro and the quais.",
    echo: "A raw space, for forms still alive.",
    level: 1,
    category: "XXe siècle",
    hint: "In the 16th arrondissement."
  },
  {
    id: "Q158",
    question: "Which Paris bridge is famous in an Apollinaire poem: \"Sous le pont…\"?",
    choices: ["A. Pont Mirabeau", "B. Pont Alexandre III", "C. Pont Neuf", "D. Pont des Arts"],
    answer: "A",
    explanation: "The Pont Mirabeau was made famous by Apollinaire's poem. It crosses the Seine between the 15th and 16th arrondissements.",
    echo: "Love passes, water passes, and yet we remain.",
    level: 1,
    category: "Art & Lettres",
    hint: "The poem begins with \"Sous le pont Mirabeau…\""
  },
  {
    id: "Q159",
    question: "What is the name of the Paris neighborhood known for its small sloping streets and its vineyard, around the Rue Lepic?",
    choices: ["A. Montmartre", "B. Le Marais", "C. La Défense", "D. Bercy"],
    answer: "A",
    explanation: "Montmartre is famous for its sloping streets, its artists, and the small Clos Montmartre vineyard.",
    echo: "A village clinging to the city.",
    level: 1,
    category: "Paris Secret",
    hint: "To the north, around the Sacré-Cœur."
  },
  {
    id: "Q160",
    question: "What is the name of the major Paris museum devoted to architecture and heritage, located in the Palais de Chaillot?",
    choices: ["A. Cité de l'architecture et du patrimoine", "B. Musée de l'Homme", "C. Musée Guimet", "D. Musée Marmottan Monet"],
    answer: "A",
    explanation: "The Cité de l'architecture et du patrimoine, in the Palais de Chaillot, presents the history of architecture, models, and casts.",
    echo: "To see the city as an idea in the making.",
    level: 1,
    category: "Art & Lettres",
    hint: "At the Trocadéro, Palais de Chaillot."
  }
];

// Helper functions
export function getQuestionsByLevel(level: 1 | 2 | 3 | 4 | 5): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.level === level);
}

export function getQuestionsByCategory(category: string): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.category === category);
}

export function getRandomQuestions(count: number, level?: number): QuizQuestion[] {
  let pool = level ? QUIZ_QUESTIONS.filter(q => q.level === level) : QUIZ_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const CATEGORIES = [
  'Repères',
  'Origines',
  'Moyen Âge',
  'Renaissance & Classique',
  'Révolution',
  'XIXe siècle',
  'Belle Époque',
  'XXe siècle',
  'Art & Lettres',
  'Paris Secret',
  'Gastronomie & Vie'
];

export const LEVELS = {
  1: { name: 'STROLLER', timer: 20, description: 'Basic, curious visitor' },
  2: { name: 'INHABITANT', timer: 15, description: 'Moderate knowledge' },
  3: { name: 'INITIATE', timer: 12, description: 'Solid culture' },
  4: { name: 'SCHOLAR', timer: 10, description: 'Historical expertise' },
  5: { name: 'ARCHAEOLOGIST', timer: 8, description: 'Secrets and rare anecdotes' }
};
