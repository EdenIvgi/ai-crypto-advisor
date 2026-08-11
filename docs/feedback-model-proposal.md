# Turning the votes into ranking

The assignment's bonus question: how would the collected feedback train a model that personalises
what each person sees. This is a design, not an implementation — nothing in the running app reads
the votes today, and the first section below is the reason I'd be careful about starting.

## What the votes actually are

Every thumb is one document, and `contentId` means something different per section. That
difference decides what can be learned:

| Section       | `contentId`   | So a vote means                                                  |
| ------------- | ------------- | ---------------------------------------------------------------- |
| `fun_meme`    | the meme's id | this specific image, and **everyone sees the same one** that day |
| `ai_insight`  | `userId:date` | this specific paragraph, recoverable from `dailyaiinsights`      |
| `market_news` | the date      | the news card as a whole, on that day                            |
| `coin_prices` | the date      | the price card as a whole, on that day                           |

**Two of the four sections cannot be trained on as they stand.** A thumbs-down on
`market_news / 2026-08-11` says the card missed, and does not say which of the five headlines
caused it or what the other four were. The headlines came from live RSS and are gone.

So the first piece of work is not a model. **It's an impressions log**: one row per section render
holding the ordered item ids, the source, `isFallback`, and the ranking version that produced the
order. Without it there is nothing to attribute a vote to; with it, the same votes already
collected start being useful the day after it ships. Everything below assumes it exists.

The second thing to be honest about: **a missing vote is not a negative.** Almost nobody votes on
almost anything, and the absence is overwhelmingly "didn't feel like clicking". Treating unvoted
content as disliked would train a model on indifference. Unvoted is _unlabeled_.

Which means the thumb is the wrong primary signal to optimise, and there's a much denser one
within reach: **a click on a headline.** It's an action taken toward the content rather than about
it, it happens far more often than a vote, and it asks nothing of the interface that isn't already
there — only that the click be recorded, which the impressions log above is the place for. I'd use
clicks as the training target and the thumbs as a smaller, higher-confidence correction — and as
the evaluation set, since an explicit opinion is the closest thing here to ground truth.

## Features

Everything below is either already stored or derivable at render time. Nothing needs a new
question asked of the user.

**The person:** `investorType` (three values), `watchedAssetIds` (a multi-hot over twelve curated
assets), how many days since signup, how many votes they've cast — the last one matters as a
feature, not just as a filter, because heavy voters behave differently.

**The context:** `sectionType`, hour of day and weekday from `createdAt`, and **`isFallback`**.
That last one is not optional. Outages cluster in time, so a model without it would learn that
people dislike particular afternoons rather than that they dislike stale content — the label would
be about the infrastructure and the feature explaining it would be missing.

**The item**, per section: for a headline, the publisher, its age at render, its position in the
list, and the overlap between the assets it names and the ones the reader watches; for a meme, its
id and how often it has been shown; for the insight, its length, and which model wrote it.

The interaction that carries most of the signal is **watched assets × item assets** — which is
what today's rule already exploits, and a learned model should be measured against that rule
rather than against nothing.

## A ranking approach that survives a cold start

I would not start with a learned model, because at this data volume it would lose to the rule it
replaced. I'd start with a scored blend and let it grow into one.

For each candidate item, score it under two terms:

- a **cohort prior** — how people with the same `investorType` treated items like this one
- a **personal term** — how this person treated items like this one

and combine them by how much is actually known about the person:

```
score = w · personal + (1 − w) · cohort,   where w = n / (n + k)
```

`n` is that person's event count and `k` is a constant tuned on held-out data. A brand-new user
gets `w = 0` and is ranked entirely by their cohort — which is available from their first screen,
because `investorType` is answered during sign-up. A heavy user's own history dominates. Nobody
ever hits an empty model, and with three investor types and twelve assets the cohort space is
small enough to fill quickly, which is a real advantage of having curated the assets.

Cohort priors themselves get shrunk toward the global average, so a sparsely populated
`investorType` doesn't produce confident nonsense from four people's opinions.

When there's enough volume to justify it, the natural next step is **gradient-boosted trees** on
exactly the features above — tabular, hundreds to thousands of rows, mixed categorical and
numeric, and an output you can explain to the person it ranked for. Not embeddings and not a
neural ranker: those need orders of magnitude more data than a project like this will produce, and
their failure mode is silent.

**Reserve an exploration slot from day one.** One item in five chosen off-policy, with the
selection probability logged next to the impression. It costs a little relevance now and it is the
only thing that makes the next section possible; retrofitting it is not an option, because you
cannot go back and log the probability of a choice already made.

## Evaluating it offline

The trap is that the data was collected by whatever ranker was live at the time, so a naive
offline score measures agreement with the old ranker rather than quality.

**Split by time, never at random.** Votes cast on the same day share the same headlines and the
same market mood; a random split puts near-duplicates on both sides and reports a score that
online traffic will not reproduce.

**Also split by user, separately**, holding out whole people to answer the cold-start question
specifically: how well does the cohort prior serve someone the model has never seen? That is the
number that decides whether the blend above is worth its complexity.

**Beat two baselines, or don't ship.** Today's keyword rule, and plain popularity — rank by what
everyone liked most, ignoring the person entirely. Popularity is embarrassingly strong and losing
to it is the clearest possible evidence that a model is memorising rather than personalising.

**Metrics matched to the section.** For news and memes, ranking metrics on the clicked or
up-voted item — NDCG at the list length actually rendered, which is five, not a generic ten. For
the insight there is one item a day and nothing to rank, so it isn't a ranking problem at all:
what's measurable is thumb direction as classification, and honestly, a paragraph a day per person
will not produce enough labels for that to mean much within this project's lifetime.

Then a **small online holdout**, because every offline number above is a ceiling on what a live
test will show, never a substitute for it.

## What would go wrong

**Self-selection.** The people who vote are not the people who use the product. Optimising thumbs
optimises for whoever enjoys pressing them, and that population's taste is not the average
reader's. This is the risk I'd flag hardest, because the metric goes up while the product gets
worse for the silent majority — and nothing in the data shows it happening.

**The feedback loop.** The model ranks what got liked, only what's ranked gets seen, and only
what's seen can be liked. An item ranked low once has no route back. That is what the exploration
slot buys, and it's why I'd rather pay for it before there's a model than argue for it after.

**Suppressing bad news is not the same as suppressing irrelevant news** — and here it has money
attached. A holder thumbs-down a headline about their asset falling; the model learns to stop
showing them headlines about their asset falling. That is a recommender working exactly as
specified and a financial product failing at its job. Negative-sentiment headlines about a watched
asset need a floor they can't be demoted below, independent of what the model wants.

**Training the insight on its own output.** The paragraph is generated, so its votes measure the
generator, and feeding them back makes the model's quirks the target. Worth keeping the insight
out of any ranking loop rather than solving.

**Low vote counts are ambiguous.** A meme nobody votes on and a meme that quietly alienates people
look identical in this data. Absence is not neutrality, and there's no way to tell them apart
without asking.

**Privacy.** Watched assets plus voting history is a disclosure about someone's portfolio and
attention. Any analysis of this data should run on aggregates, the reviewer credential should stay
read-only, and none of it belongs in a log line.

## What I'd do first, in order

1. The impressions log, with the exploration probability recorded. Nothing else is possible without it.
2. Clicks as the dense signal; keep the thumbs as the evaluation set.
3. The cohort-plus-personal blend, measured against the keyword rule and against popularity.
4. Trees, only once the held-out numbers say the blend is being held back by its own shape.
