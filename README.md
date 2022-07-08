# Playdate Video Encoder

This project is a Playdate Video encoder. `.pdv` files can be played on a Playdate using the [`video` player](https://sdk.play.date/1.12.1/Inside%20Playdate.html#C-graphics.video) in the SDK. You can also run a `.pdv` file using [Playorama](https://github.com/hteumeuleu/playorama), “_A cranky video player for the Playdate_” that I also built.

## Installation

This project runs on Jekyll. (Because… Why not?)

1. **Clone the repository**.

```sh
git clone https://github.com/hteumeuleu/pdv.git
```

See [Cloning a repository](https://help.github.com/en/articles/cloning-a-repository) on GitHub documentation. If you're not familiar with Git or GitHub, I strongly encourage you to try [GitHub's desktop app](https://desktop.github.com/) on macOS, Windows or Linux.

2. **Install Jekyll** and other dependencies.

```sh
bundle install
```

See [Jekyll Installation Guide](https://jekyllrb.com/docs/installation/).

3. **Run Jekyll**.

```sh
bundle exec jekyll serve
```

You can turn on [incremental regeneration](https://jekyllrb.com/docs/configuration/incremental-regeneration/) with the `--incremental` flag.

```sh
bundle exec jekyll serve --incremental
```

4. **Go to [http://localhost:4000](http://localhost:4000)**.

