# Squirdle
A Pokémon Wordle-like, found at [squirdle.fireblend.com](http://squirdle.fireblend.com/)

Featured on [Kotaku](https://kotaku.com/wordle-squirdle-daily-puzzle-word-game-free-browser-1848499480), [GamesRadar](https://www.gamesradar.com/theres-a-pokemon-themed-wordle-called-drumroll-squirdle/), [Forbes](https://www.forbes.com/sites/paultassi/2022/02/09/another-wordle-alternative-squirdle-wants-you-to-guess-that-pokemon/?sh=6a7996747b94), [TechRadar](https://www.techradar.com/sg/news/games-like-wordle-the-best-spinoffs-and-alternatives) and others!

<img src="https://i.imgur.com/nbHjRow.png" width=465px>

Pokémon data based on [Mario Tormo Romero's Pokemon dataset](https://www.kaggle.com/mariotormo/complete-pokemon-dataset-updated-090420).

Pull requests welcome!
### Running Locally
#### Requirements
* A Python 3.8+ environment

#### Running
1. Clone the repo and navigate inside the newly cloned directory.
2. Rename `fake-daily.csv` to `daily.csv`: `mv fake-daily.csv daily.csv`
3. Execute `pip install -r requirements.txt` to install Python dependencies.
4. Run the application with `python app.py` and enter the specified `localhost` URL.

### Deploying to AWS
#### Requirements
* Make sure you can run the app locally first.
* An AWS account.
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed & setup to use your AWS account.
* [Serverless](https://serverless.com/framework/docs/providers/aws/guide/quick-start/) installed & setup.

#### Running
1. Check the `serverless.yaml` file for anything you might want to modify (mainly make sure the listed Python version matches your local Python version).
2. Install the required plugins into your cloned directory: `npm install --save serverless-wsgi serverless-python-requirements serverless-apigw-binary`.
3. Execute `sls deploy` and wait.

Execute `sls remove` to destroy the instance and all associated AWS resources.
