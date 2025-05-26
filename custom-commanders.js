import fs from 'fs';
import csv from 'csv-parser';

// Define input and output file paths
const inputFilePath = 'edhForm.csv';  // Replace with your CSV file path
const outputFilePath = 'Custom Commanders.txt'; // Replace with the desired output text file path

// Initialize an array to hold player data
const players = [];

// Read and parse the CSV file
fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (row) => {
    // Push each player row data into the players array
    players.push(row);
  })
  .on('end', () => {
    // Once CSV parsing is complete, write to output file
    const output = players.map(player => {
      return `Player: ${player.Name}\n` +
        `Colors: ${player.Identity}\n` +
        `Themes: ${player.Playstyles}\n` +
        `Tribes: ${player.Tribes}\n` +
        `Liked Mechanics: ${player.Likes}\n` +
        `Disliked Mechanics: ${player.Dislikes}\n` +
        `Favourite Cards: ${player.Cards}\n` +
        `Please Avoid: ${player.Banlist}\n` +
        '-----------------------------\n';
    }).join('');

    // Write the formatted data to the output text file
    fs.writeFile(outputFilePath, output, (err) => {
      if (err) throw err;
      console.log('Data successfully written to output.txt');
    });
  });
