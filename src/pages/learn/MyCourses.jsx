import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/useAsync.js';
import { Empty, Loading } from '../../components.jsx';
import { CourseCards } from './StudentHome.jsx';

export default function MyCourses() {
  const state = useAsync(() => api.get('/lms/courses'), []);
  return (
    <>
      <div className="page-head"><div><h1>My courses</h1><p className="sub">Everything you are enrolled in.</p></div></div>
      <Loading state={state}>
        {state.data && (state.data.items.length === 0
          ? <div className="panel"><Empty title="No courses yet">When your instructor enrols you in a course, it shows up here.</Empty></div>
          : <CourseCards items={state.data.items} />)}
      </Loading>
    </>
  );
}
