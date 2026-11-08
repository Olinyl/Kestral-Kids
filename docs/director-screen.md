# Director screen implementation

Implements the director requirements in SPEC.md while preserving the other role owners' starter screens.

1. Add a director-only module and stylesheet, served and copied by the existing build.
2. Enrich the two existing fictional child records with contacts and instructors. Keep existing IDs and roster counts.
3. Connect Overview, Children, Guardians, Instructors and Lesson groups through the existing role navigation.
4. Use in-memory fixture edits for add/edit dialogs, validation and group assignment. Derive readiness and capacity from records; enforce the six-child limit across groups for each instructor.
5. Keep guardian consent read-only, and use no SDK or business API calls.
6. Verify the six director acceptance tests and the two unchanged starter outcomes, then inspect desktop and phone screenshots.
7. Run doctor, the quality scan and final Piezas checks before publishing the public mock.

The inherited green design and top-level role selector remain. No new visual identity, production sign-in, external messages or account administration is included.
