




### Public Routes

- [ ] `/project` - Show a list of all Published Projects (meaning they have treasuryNftPolicyId)
- [ ] `/project/[treasurynft]` - Project view with valid NFT ID
- [ ] `/project/[treasurynft]/[projecthash]` - View a Public Project Task in a given Project
- [ ] `/project/[treasurynft]/[projecthash]` - Also on this route, if the connected Contributor has a Commitment, they should see it here.
- [ ] Prerequisite validation displays correctly
- [ ] Submission form works

### Studio Routes (Active)

- [ ] `/studio/project` - Contribution manager views a list of owned Projects
- [ ] `/studio/project/[treasurynft]` - Project dashboard for Project Manager / Owner
- [ ] `/studio/project/[treasurynft]/manage-treasury` -  Project Manager / Owner approves drafted Tasks for publishing and runs on-chain transactions
- [ ] `/studio/project/[treasurynft]/manage-contributors` - View a list of enrolled Contributors
- [ ] `/studio/project/[treasurynft]/commitments` - View a list of Task Commitments to this Project
- [ ] `/studio/project/[treasurynft]/commitments/[alias]` - View Task Commitments for a specific Contributor
- [ ] `/studio/project/[treasurynft]/draft-tasks` - Draft a new Task
- [ ] `/studio/project/[treasurynft]/draft-tasks/new` - Task creation works
- [ ] `/studio/project/[treasurynft]/draft-tasks/[taskindex]` - Task editing works
- [ ] `/studio/project/[treasurynft]/transactions` - Transactions display