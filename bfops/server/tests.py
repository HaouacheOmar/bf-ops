from django.test import TestCase
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APIClient

from .models import Assignment, Company, Grade, Job, Person, Unite, Year


class TransferSuggestionTests(TestCase):
	def setUp(self):
		self.client = APIClient()

		self.year, _ = Year.objects.get_or_create(year=2026, defaults={"total_quota": 0})

		self.grade_x = Grade.objects.create(name="Grade X", code="GX")
		self.grade_y = Grade.objects.create(name="Grade Y", code="GY")

		self.unite_a = Unite.objects.create(name="Unite A", code="UA")
		self.unite_b = Unite.objects.create(name="Unite B", code="UB")

		self.company_a1 = Company.objects.create(name="Company A-1", code="CA1", unite=self.unite_a)
		self.company_a2 = Company.objects.create(name="Company A-2", code="CA2", unite=self.unite_a)
		self.company_b1 = Company.objects.create(name="Company B-1", code="CB1", unite=self.unite_b)

		self.source_job = Job.objects.create(
			name="Agent Polyvalent A1",
			code="JOB-A1",
			company=self.company_a1,
			max_workers=1,
		)
		self.source_job.grades.add(self.grade_x)

		self.internal_destination_job = Job.objects.create(
			name="Agent Polyvalent A2",
			code="JOB-A2",
			company=self.company_a2,
			max_workers=1,
		)
		self.internal_destination_job.grades.add(self.grade_x)

		self.external_destination_job = Job.objects.create(
			name="Agent Polyvalent B1",
			code="JOB-B1",
			company=self.company_b1,
			max_workers=2,
		)
		self.external_destination_job.grades.add(self.grade_x)

		self.mismatch_destination_job = Job.objects.create(
			name="Specialist B1",
			code="JOB-B1-Y",
			company=self.company_b1,
			max_workers=1,
		)
		self.mismatch_destination_job.grades.add(self.grade_y)

		self.persons = []
		self.assignments = []
		for idx in range(1, 4):
			person = Person.objects.create(
				first_name=f"P{idx}",
				last_name="Worker",
				matricule=f"NID-{idx}",
				grade=self.grade_x,
				unite=self.unite_a,
				company=self.company_a1,
				job=self.source_job,
			)
			assignment = Assignment.objects.create(person=person, job=self.source_job, year=self.year)
			self.persons.append(person)
			self.assignments.append(assignment)

	def test_transfer_suggestions_include_internal_external_and_mark_paths(self):
		response = self.client.get(f"/api/transfers-suggestions/?year_id={self.year.id}")
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		payload = response.json()
		suggestions = payload.get("results", [])

		self.assertGreaterEqual(len(suggestions), 2)

		transfer_types = {item["transfer_type"] for item in suggestions}
		self.assertIn("internal", transfer_types)
		self.assertIn("external", transfer_types)

		for item in suggestions:
			self.assertTrue(item.get("requires_validation"))
			self.assertIn("source", item)
			self.assertIn("destination", item)
			self.assertIn("unite_id", item["source"])
			self.assertIn("company_id", item["source"])
			self.assertIn("job_id", item["source"])
			self.assertIn("unite_id", item["destination"])
			self.assertIn("company_id", item["destination"])
			self.assertIn("job_id", item["destination"])

		destination_job_ids = {item["destination"]["job_id"] for item in suggestions}
		self.assertNotIn(self.mismatch_destination_job.id, destination_job_ids)

	def test_transfer_suggestions_support_internal_and_external_filters(self):
		internal_response = self.client.get(
			f"/api/transfers-suggestions/?year_id={self.year.id}&transfer_kind=internal"
		)
		external_response = self.client.get(
			f"/api/transfers-suggestions/?year_id={self.year.id}&transfer_kind=external"
		)

		self.assertEqual(internal_response.status_code, status.HTTP_200_OK)
		self.assertEqual(external_response.status_code, status.HTTP_200_OK)

		internal_suggestions = internal_response.json().get("results", [])
		external_suggestions = external_response.json().get("results", [])

		self.assertGreaterEqual(len(internal_suggestions), 1)
		self.assertGreaterEqual(len(external_suggestions), 1)

		self.assertTrue(all(item["transfer_type"] == "internal" for item in internal_suggestions))
		self.assertTrue(all(item["transfer_type"] == "external" for item in external_suggestions))

	def test_execute_transfer_allows_internal_transfer_when_destination_changes(self):
		assignment = self.assignments[0]
		response = self.client.post(
			"/api/transfers-execute/",
			{
				"assignment_id": assignment.id,
				"new_unite_id": self.unite_a.id,
				"new_company_id": self.company_a2.id,
				"new_job_id": self.internal_destination_job.id,
				"reason": "Internal suggested move",
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		assignment.refresh_from_db()
		self.assertEqual(assignment.job_id, self.internal_destination_job.id)

	def test_execute_transfer_auto_uses_same_name_job_in_destination_company(self):
		same_name_destination_job = Job.objects.create(
			name=self.source_job.name,
			code="JOB-A2-SAME",
			company=self.company_a2,
			max_workers=1,
		)
		same_name_destination_job.grades.add(self.grade_x)

		assignment = self.assignments[0]
		response = self.client.post(
			"/api/transfers-execute/",
			{
				"assignment_id": assignment.id,
				"new_unite_id": self.unite_a.id,
				"new_company_id": self.company_a2.id,
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		assignment.refresh_from_db()
		self.assertEqual(assignment.job_id, same_name_destination_job.id)

	def test_execute_transfer_rejects_same_unite_without_destination_change(self):
		assignment = self.assignments[1]
		response = self.client.post(
			"/api/transfers-execute/",
			{
				"assignment_id": assignment.id,
				"new_unite_id": self.unite_a.id,
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class StatsAggregationTests(TestCase):
	def setUp(self):
		self.client = APIClient()

		self.year, _ = Year.objects.get_or_create(year=2026, defaults={"total_quota": 0})
		self.unite = Unite.objects.create(name="Regiment", code="REG")

		self.commandement = Company.objects.create(
			name="Commandement",
			code="CMD",
			unite=self.unite,
		)
		self.mounawara = Company.objects.create(
			name="Mounawara",
			code="MNW",
			unite=self.unite,
		)

		self.job_commandement = Job.objects.create(
			name="Agent Polyvalent",
			code="AP-CMD",
			company=self.commandement,
			max_workers=3,
		)
		self.job_mounawara = Job.objects.create(
			name="Agent Polyvalent",
			code="AP-MNW",
			company=self.mounawara,
			max_workers=20,
		)

		for idx in range(1, 3):
			person = Person.objects.create(
				first_name=f"Cmd{idx}",
				last_name="Worker",
				matricule=f"CMD-{idx}",
				unite=self.unite,
				company=self.commandement,
				job=self.job_commandement,
			)
			Assignment.objects.create(person=person, job=self.job_commandement, year=self.year)

		for idx in range(1, 11):
			person = Person.objects.create(
				first_name=f"Mnw{idx}",
				last_name="Worker",
				matricule=f"MNW-{idx}",
				unite=self.unite,
				company=self.mounawara,
				job=self.job_mounawara,
			)
			Assignment.objects.create(person=person, job=self.job_mounawara, year=self.year)

	def test_duplicate_job_name_across_companies_is_allowed(self):
		self.assertEqual(self.job_commandement.name, self.job_mounawara.name)
		self.assertNotEqual(self.job_commandement.id, self.job_mounawara.id)

	def test_duplicate_job_name_in_same_company_is_rejected(self):
		with self.assertRaises(IntegrityError):
			Job.objects.create(
				name="Agent Polyvalent",
				code="AP-CMD-2",
				company=self.commandement,
				max_workers=1,
			)

	def test_job_api_returns_400_for_duplicate_name_in_same_company(self):
		response = self.client.post(
			"/api/jobs/",
			{
				"name": "Agent Polyvalent",
				"code": "AP-CMD-API",
				"company": self.commandement.id,
				"max_workers": 1,
				"grades": [],
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_company_stats_keep_capacity_per_company(self):
		response = self.client.get(f"/api/stats/companies/?year_id={self.year.id}")
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		stats = response.json().get("results", [])
		stats_by_company = {row["company_name"]: row for row in stats}

		self.assertEqual(stats_by_company["Commandement"]["max_workers"], 3)
		self.assertEqual(stats_by_company["Mounawara"]["max_workers"], 20)
		self.assertEqual(stats_by_company["Commandement"]["current_workers"], 2)
		self.assertEqual(stats_by_company["Mounawara"]["current_workers"], 10)

	def test_unite_stats_sum_company_capacities(self):
		response = self.client.get(f"/api/stats/unites/?year_id={self.year.id}")
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		stats = response.json()
		regiment = next((row for row in stats if row["unite_id"] == self.unite.id), None)

		self.assertIsNotNone(regiment)
		self.assertEqual(regiment["max_workers"], 23)
		self.assertEqual(regiment["current_workers"], 12)
