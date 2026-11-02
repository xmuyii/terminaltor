"""
Test Suite: Phase 5.5 Academy Seats & Capacity
Tests:
- Seat cap enforcement: Premium (30), Pro (100)
- Seat cap overflow rejection (31st student rejected)
- Unique active academy constraint (one active academy per student)
- Seat vacation when member removed
"""

import unittest
from services.academies import AcademiesService, SEAT_CAP_PREMIUM, SEAT_CAP_PRO


class TestAcademySeats(unittest.TestCase):
    def setUp(self):
        self.service = AcademiesService()
        self.academy_prem = self.service.create_academy(
            name="Lagos Science Alliance",
            owner_id="owner_123",
            plan="premium",
            auto_activate=True,
        )

    def test_seat_cap_assignment(self):
        self.assertEqual(self.academy_prem["seat_cap"], SEAT_CAP_PREMIUM)

        academy_pro = self.service.create_academy(
            name="Apex Engineering Guild",
            owner_id="owner_456",
            plan="pro",
            auto_activate=True,
        )
        self.assertEqual(academy_pro["seat_cap"], SEAT_CAP_PRO)

    def test_seat_cap_strict_enforcement(self):
        code = self.academy_prem["join_code"]

        # Enroll exactly 30 students
        for i in range(30):
            res = self.service.join_academy(user_id=f"student_{i}", join_code=code)
            self.assertEqual(res["status"], 200, f"Failed at student {i}: {res}")

        active_count = len(self.service.get_active_members(self.academy_prem["id"]))
        self.assertEqual(active_count, 30)

        # 31st student must be blocked with 409 seat_cap_exceeded
        res_31 = self.service.join_academy(user_id="student_31", join_code=code)
        self.assertEqual(res_31["status"], 409)
        self.assertEqual(res_31["error"], "seat_cap_exceeded")

    def test_one_active_academy_per_student_rule(self):
        academy_2 = self.service.create_academy(
            name="Ibadan Tech Institute",
            owner_id="owner_999",
            plan="premium",
            auto_activate=True,
        )

        # Student joins academy 1
        res1 = self.service.join_academy("student_ade", self.academy_prem["join_code"])
        self.assertEqual(res1["status"], 200)

        # Student attempts to join academy 2 while still in academy 1
        res2 = self.service.join_academy("student_ade", academy_2["join_code"])
        self.assertEqual(res2["status"], 409)
        self.assertEqual(res2["error"], "already_in_academy")

    def test_member_removal_vacates_seat(self):
        code = self.academy_prem["join_code"]

        # Enroll 30 students to max out
        for i in range(30):
            self.service.join_academy(user_id=f"st_{i}", join_code=code)

        # Owner removes one student
        rm_res = self.service.remove_member(
            academy_id=self.academy_prem["id"],
            owner_id="owner_123",
            target_user_id="st_15",
        )
        self.assertEqual(rm_res["status"], 200)

        # Now 31st student can take the newly vacated seat
        res_new = self.service.join_academy(user_id="st_replacement", join_code=code)
        self.assertEqual(res_new["status"], 200)


if __name__ == "__main__":
    unittest.main()
